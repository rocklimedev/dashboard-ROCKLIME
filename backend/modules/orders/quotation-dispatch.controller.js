const { can } = require('../../middleware/permission');
const { Op } = require('sequelize');
const { Quotation, Order, OrderDispatch } = require('../../models');
const sequelize = require('../../config/database');
const stock = require('../stock/stock.service');
const { getSetting } = require('../settings/settings.service');
const { enrichQuotation, renderQuotationPdf } = require('../quotations/quotation-pdf');
const { quotationTotals, pricingFromRecord } = require('../../lib/quotationMath');
const {
  asList,
  remainingLines,
  selectDispatchItems,
  batchQuotation,
  allocateOrders,
  allocatedItems,
} = require('./dispatch-document');
const { transportFields } = require('./order-dispatch.controller');
const { createQuotationOrder } = require('./quotation-order');

async function quotationHistory(quotationId, transaction) {
  const orders = await Order.findAll({ where: { quotationId }, attributes: ['id'], transaction });
  return OrderDispatch.findAll({
    attributes: { exclude: ['documentSnapshot'] },
    where: {
      [Op.or]: [
        { quotationId },
        ...(orders.length ? [{ orderId: { [Op.in]: orders.map((o) => o.id) } }] : []),
      ],
    },
    order: [['createdAt', 'ASC']],
    transaction,
  });
}
exports.quotationHistory = quotationHistory;
async function creditedDispatches(order, transaction) {
  if (!order.quotationId) return [];
  const direct = await OrderDispatch.findAll({
    where: { quotationId: order.quotationId, orderId: null },
    transaction,
  });
  return direct
    .map((d) => ({
      ...(d.toJSON ? d.toJSON() : d),
      sourceQuotationDispatch: true,
      items: allocatedItems(d, order.id),
    }))
    .filter((d) => d.items.length);
}
exports.creditedDispatches = creditedDispatches;
exports.list = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    const dispatches = await quotationHistory(quotation.quotationId);
    const orders = await Order.findAll({
      where: { quotationId: quotation.quotationId, status: { [Op.ne]: 'CANCELED' } },
      attributes: ['id', 'orderNo', 'status', 'shipTo', 'description', 'assignedUserId'],
      order: [['createdAt', 'ASC']],
    });
    const lines = remainingLines(quotation.products, dispatches);
    res.json({
      dispatches,
      lines,
      orders,
      fullyDispatched: lines.length > 0 && lines.every((line) => line.remaining === 0),
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};
exports.create = async (req, res) => {
  try {
    const transport = transportFields(req.body);
    if (transport.error) return res.status(400).json({ message: transport.error });
    if (!(await can(req.user, 'orders', 'view')) || !(await can(req.user, 'orders', 'write')))
      return res.status(403).json({
        message: 'Quotation dispatch requires orders → view and orders → write permissions.',
      });
    const result = await sequelize.transaction(async (t) => {
      const quotation = await Quotation.findByPk(req.params.id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!quotation) throw Object.assign(new Error('Quotation not found'), { status: 404 });
      if (['LOST', 'EXPIRED'].includes(quotation.status))
        throw Object.assign(new Error('Reopen this quotation before dispatching.'), {
          status: 400,
        });
      const previous = await quotationHistory(quotation.quotationId, t);
      const selected = selectDispatchItems(
        remainingLines(quotation.products, previous),
        req.body.items,
      );
      const linkedOrders = await Order.findAll({
        where: {
          quotationId: quotation.quotationId,
          status: {
            [Op.in]: [
              'PREPARING',
              'CHECKING',
              'INVOICE',
              'PARTIALLY_DISPATCHED',
              'PARTIALLY_DELIVERED',
              'ONHOLD',
            ],
          },
        },
        order: [
          ['createdAt', 'ASC'],
          ['id', 'ASC'],
        ],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!linkedOrders.length) {
        const order = await createQuotationOrder(quotation, previous, req.body, req.user.userId, t);
        linkedOrders.push(order);
        await stock.syncOrder(order.id, { t, userId: req.user.userId });
      }
      const items = allocateOrders(selected, linkedOrders, previous);
      const reservationLimits = {};
      for (const item of items)
        for (const allocation of item.orderAllocations) {
          const limits = (reservationLimits[item.productId] ||= {});
          limits[allocation.orderId] = (limits[allocation.orderId] || 0) + allocation.quantity;
        }
      const count = await OrderDispatch.count({
        where: { quotationId: quotation.quotationId, orderId: null },
        transaction: t,
      });
      const reference = quotation.reference_number + '/D' + (count + 1);
      const date = new Date();
      const q = batchQuotation(
        { ...quotation.toJSON(), shipTo: linkedOrders[0].shipTo },
        asList(quotation.products),
        items,
        reference,
        date,
      );
      const documentSnapshot = await enrichQuotation(q, items);
      documentSnapshot.companyState = (await getSetting('company')).state;
      const totals = quotationTotals({
        ...q,
        ...pricingFromRecord(q),
        items,
        shipping: q.shippingAmount,
        gstRate: q.gst,
      });
      const saved = await OrderDispatch.create(
        {
          quotationId: quotation.quotationId,
          quotationRef: quotation.reference_number,
          orderId: null,
          orderNo: String(quotation.reference_number).slice(0, 30),
          dispatchNumber: count + 1,
          items,
          documentSnapshot,
          totalQuantity: items.reduce((sum, p) => sum + p.quantity, 0),
          totalAmount: totals.grandTotal,
          dispatchedBy: req.user.userId,
          dispatchDate: date,
          carrier:
            String(req.body.carrier || '')
              .trim()
              .slice(0, 150) || null,
          trackingNumber:
            String(req.body.trackingNumber || '')
              .trim()
              .slice(0, 150) || null,
          remarks: String(req.body.remarks || '').trim() || null,
          ...transport.values,
          transporter: transport.values.transporter || req.body.carrier || null,
          lrNumber: transport.values.lrNumber || req.body.trackingNumber || null,
        },
        { transaction: t },
      );
      await stock.dispatchOut(
        {
          id: quotation.quotationId,
          orderNo: quotation.reference_number,
          sourceLabel: 'quotation',
        },
        items,
        {
          t,
          userId: req.user.userId,
          dispatchId: saved.id,
          dispatchNo: saved.dispatchNumber,
          reservationLimits,
        },
      );
      for (const order of linkedOrders) {
        if (!items.some((item) => item.orderAllocations.some((a) => a.orderId === order.id)))
          continue;
        const needs = await stock.orderNeeds(order, t);
        await order.update(
          {
            status: needs.every((line) => line.needed === 0)
              ? 'DISPATCHED'
              : 'PARTIALLY_DISPATCHED',
          },
          { transaction: t },
        );
        await stock.syncOrder(order.id, { t, userId: req.user.userId });
      }
      await quotation.update(
        {
          status: 'WON',
          statusChangedAt: new Date(),
          nextFollowUp: null,
          lostReason: null,
          lostNote: null,
        },
        { transaction: t },
      );
      return {
        dispatch: saved,
        orders: linkedOrders.map((order) => ({
          id: order.id,
          orderNo: order.orderNo,
          status: order.status,
        })),
        fullyDispatched: remainingLines(quotation.products, [...previous, saved]).every(
          (line) => line.remaining === 0,
        ),
      };
    });
    res.status(201).json({ message: 'Quotation dispatch recorded', ...result });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

async function snapshotForOrder(order, dispatchItems, number) {
  const quote = order.quotationId ? await Quotation.findByPk(order.quotationId) : null;
  const source = quote?.toJSON() || {
    customerId: order.createdFor,
    shipTo: order.shipTo,
    gst: order.gst || 0,
    createdBy: order.createdBy,
    floors: order.floors || [],
  };
  const all = asList(order.products);
  const quoted = asList(quote?.products);
  const items = dispatchItems.map((item) => {
    const original = all.find((p) => p.productId === item.productId) || {};
    const location = quoted.find((p) => p.productId === item.productId) || {};
    return {
      ...location,
      ...original,
      ...item,
      locations: [],
      isOptionFor: null,
      optionType: null,
    };
  });
  const q = batchQuotation(source, quote ? quoted : all, items, order.orderNo + '/D' + number);
  return {
    ...(await enrichQuotation(q, items)),
    companyState: (await getSetting('company')).state,
    sourceQuotationRef: quote?.reference_number || null,
  };
}
exports.snapshotForOrder = snapshotForOrder;

/** Existing order dispatches also open in the shared quotation document layout. */
async function dispatchData(id) {
  const dispatch = await OrderDispatch.findByPk(id);
  if (!dispatch) throw Object.assign(new Error('Dispatch not found'), { status: 404 });
  if (dispatch.documentSnapshot) return { dispatch, document: dispatch.documentSnapshot };
  const order = dispatch.orderId ? await Order.findByPk(dispatch.orderId) : null;
  const quote =
    dispatch.quotationId || order?.quotationId
      ? await Quotation.findByPk(dispatch.quotationId || order.quotationId)
      : null;
  const source = quote?.toJSON() || {
    customerId: order?.createdFor,
    shipTo: order?.shipTo,
    document_title: order?.document_title || '',
    gst: order?.gst || 0,
    createdBy: dispatch.dispatchedBy,
  };
  const all = asList(quote?.products || order?.products);
  const items = asList(dispatch.items).map((item) => {
    const original = all.find((p) => p.productId === item.productId) || {};
    return {
      ...original,
      ...item,
      isOptionFor: null,
      optionType: null,
      locations: [],
      total: item.total,
    };
  });
  const q = batchQuotation(
    source,
    all,
    items,
    (dispatch.quotationRef || dispatch.orderNo) + '/D' + dispatch.dispatchNumber,
    dispatch.dispatchDate,
  );
  return {
    dispatch,
    document: {
      ...(await enrichQuotation(q, items)),
      companyState: (await getSetting('company')).state,
    },
  };
}
exports.dispatchData = dispatchData;
async function requireRead(req, dispatch) {
  const module = dispatch.orderId ? 'orders' : 'quotations';
  if (!(await can(req.user, module, 'view')) && !(await can(req.user, 'orders', 'view')))
    throw Object.assign(new Error('You do not have permission to view this dispatch.'), {
      status: 403,
    });
}
exports.details = async (req, res) => {
  try {
    const result = await dispatchData(req.params.dispatchId);
    await requireRead(req, result.dispatch);
    res.json({ dispatch: result.dispatch, document: result.document });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};
exports.pdf = async (req, res) => {
  try {
    const { dispatch, document } = await dispatchData(req.params.dispatchId);
    await requireRead(req, dispatch);
    let exportOptions = {};
    try {
      exportOptions = JSON.parse(req.query.exportOptions || '{}');
    } catch {
      return res.status(400).json({ message: 'Invalid export options' });
    }
    const [company, settings] = await Promise.all([getSetting('company'), getSetting('quotation')]);
    const { buffer, filename, pageLabels } = await renderQuotationPdf(document, {
      company,
      settings,
      documentLabel: 'Dispatch',
      style: req.query.style,
      cover: req.query.cover == null ? null : req.query.cover === '1',
      exportOptions,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="Dispatch-' + filename.replace(/["\r\n]/g, '').replace(/[/\\]/g, '-') + '"',
    );
    res.setHeader('X-Quotation-Pages', encodeURIComponent(JSON.stringify(pageLabels)));
    res.send(buffer);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

exports.authorizeDelivery = async (req, res, next) => {
  try {
    const dispatch = await OrderDispatch.findByPk(req.params.dispatchId);
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });
    const module = dispatch.orderId ? 'orders' : 'quotations';
    if (!(await can(req.user, module, 'edit')) && !(await can(req.user, 'orders', 'edit')))
      return res
        .status(403)
        .json({ message: 'You do not have permission to confirm this delivery.' });
    next();
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.share = async (req, res) => {
  try {
    const { dispatch, document } = await dispatchData(req.params.dispatchId);
    await requireRead(req, dispatch);
    const style = ['detailed', 'compact'].includes(req.body?.style) ? req.body.style : 'detailed';
    const days = Math.min(90, Math.max(1, Number(req.body?.days) || 30));
    const { signShare } = require('../../lib/shareToken');
    const token = signShare(
      {
        t: 'dispatch',
        id: dispatch.id,
        s: style,
        c: req.body?.cover == null ? null : req.body.cover ? 1 : 0,
      },
      days,
    );
    const base = (process.env.PUBLIC_BACKEND_URL || req.protocol + '://' + req.get('host')).replace(
      /\/+$/,
      '',
    );
    const url = base + '/api/public/dispatch/' + token + '.pdf';
    const text =
      'Dear ' +
      (document.customer?.name || 'Sir/Madam') +
      ', please find dispatch ' +
      document.quotation.reference_number +
      ': ' +
      url;
    const phone = String(document.customer?.mobileNumber || '').replace(/\D/g, '');
    const waPhone = phone.length === 10 ? '91' + phone : phone;
    res.json({
      url,
      expiresInDays: days,
      message: text,
      whatsapp: 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(text),
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};
