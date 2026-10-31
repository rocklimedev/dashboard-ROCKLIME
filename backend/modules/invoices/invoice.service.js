// GST tax invoices.
//
//   An invoice bills some or all of an order's pieces at the order's own prices
//   (line discounts as on the order), using the same GST maths as quotations
//   (lib/quotationMath): freight and the order's extra discount, then GST on the
//   taxable value — CGST + SGST inside the company's state, IGST outside it.
//
//   • A piece is never billed twice: each invoice may only bill what is still
//     un-invoiced on the order (cancelled invoices free their pieces again).
//   • Freight goes on the order's first invoice; a fixed extra discount is
//     shared by value, and the last invoice takes what is left so the order
//     adds up exactly.
//   • Numbers run per financial year (April–March): CM/26-27/0001.
//   • Invoices are frozen snapshots and can only be cancelled, never edited.
const { QueryTypes } = require('sequelize');
const { quotationTotals, lineAmounts, r2, pricingFromRecord } = require('../../lib/quotationMath');
const { getSetting } = require('../settings/settings.service');

const m = () => require('../../models');
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });
const norm = (s) =>
  String(s || '')
    .trim()
    .toLowerCase();
const asList = (v) => {
  let x = v;
  for (let i = 0; i < 3 && typeof x === 'string'; i++) {
    try {
      x = JSON.parse(x);
    } catch {
      return [];
    }
  }
  return Array.isArray(x) ? x : [];
};
const pid = (line) => line.productId || line.id;

/** "26-27" for 2026-04-01 … 2027-03-31 (Indian time). */
function financialYear(date = new Date()) {
  const d = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}
const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

async function nextInvoiceNo(fy, t) {
  const { sequelize } = m();
  await sequelize.query('INSERT IGNORE INTO invoice_counters (financialYear, last) VALUES (?, 0)', {
    replacements: [fy],
    transaction: t,
  });
  const [row] = await sequelize.query(
    'SELECT last FROM invoice_counters WHERE financialYear = ? FOR UPDATE',
    {
      replacements: [fy],
      type: QueryTypes.SELECT,
      transaction: t,
    },
  );
  const next = Number(row?.last || 0) + 1;
  await sequelize.query('UPDATE invoice_counters SET last = ? WHERE financialYear = ?', {
    replacements: [next, fy],
    transaction: t,
  });
  const { invoicePrefix } = await getSetting('accounts');
  const prefix =
    String(invoicePrefix || 'CM')
      .replace(/[^A-Za-z0-9-]/g, '')
      .slice(0, 5) || 'CM';
  return `${prefix}/${fy}/${String(next).padStart(4, '0')}`;
}

/** Pieces already billed on live invoices of this order: { productId: qty }. */
async function invoicedQty(orderId, t) {
  const { TaxInvoice } = m();
  const rows = await TaxInvoice.findAll({
    where: { orderId, status: 'ISSUED' },
    attributes: ['lines'],
    transaction: t,
  });
  const out = {};
  for (const r of rows)
    for (const l of asList(r.lines))
      if (l.productId) out[l.productId] = (out[l.productId] || 0) + Number(l.qty || 0);
  return out;
}

/** What is still to be billed on the order, per product. */
async function remainingToInvoice(order, t) {
  const done = await invoicedQty(order.id, t);
  const ordered = {};
  for (const l of asList(order.products)) {
    const id = pid(l);
    if (id) ordered[id] = (ordered[id] || 0) + (Number(l.quantity) || 0);
  }
  return Object.entries(ordered)
    .map(([productId, qty]) => ({
      productId,
      ordered: qty,
      invoiced: done[productId] || 0,
      remaining: Math.max(qty - (done[productId] || 0), 0),
    }))
    .filter((x) => x.ordered > 0);
}

async function productInfo(ids) {
  const { Product, ProductMeta } = m();
  if (!ids.length) return {};
  const [products, defs] = await Promise.all([
    Product.findAll({
      where: { productId: ids },
      attributes: ['productId', 'name', 'product_code', 'meta', 'tax'],
    }),
    ProductMeta.findAll({ attributes: ['id', 'slug', 'title'] }),
  ]);
  const hsnDef = defs.find(
    (d) => d.slug === 'hsnCode' || norm(d.title) === 'hsn code' || norm(d.title) === 'hsn',
  );
  const unitDef = defs.find((d) => ['unit', 'uom'].includes(d.slug) || norm(d.title) === 'unit');
  const out = {};
  for (const p of products) {
    let meta = p.meta;
    for (let i = 0; i < 3 && typeof meta === 'string'; i++) {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }
    out[p.productId] = {
      name: p.name,
      code: p.product_code || null,
      hsn: (hsnDef && meta?.[hsnDef.id]) || null,
      unit: (unitDef && meta?.[unitDef.id]) || 'PCS',
    };
  }
  return out;
}

async function parties(order, t) {
  const { Customer, Address } = m();
  const company = await getSetting('company');
  const customer = order.createdFor
    ? await Customer.findByPk(order.createdFor, { transaction: t })
    : null;
  const addrs = customer
    ? await Address.findAll({ where: { customerId: customer.customerId }, transaction: t })
    : [];
  const billing =
    addrs.find((a) => a.status === 'BILLING') ||
    addrs.find((a) => a.status === 'PRIMARY') ||
    addrs[0] ||
    null;
  const ship = order.shipTo ? await Address.findByPk(order.shipTo, { transaction: t }) : billing;
  const pos = ship?.state || billing?.state || company.state;
  const interState = Boolean(pos && company.state && norm(pos) !== norm(company.state));
  const addr = (a) =>
    a
      ? {
          street: a.street,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          country: a.country,
        }
      : null;
  return {
    company,
    customer,
    billTo: {
      name: customer?.companyName || customer?.name || 'Customer',
      phone: customer?.mobileNumber || null,
      email: customer?.email || null,
      gstin: customer?.gstNumber || null,
      address: addr(billing),
    },
    shipTo: { name: customer?.name || null, address: addr(ship) },
    placeOfSupply: pos || null,
    interState,
  };
}

/**
 * Builds (does not save) an invoice for `items` [{ productId, quantity }] of an order.
 * Without items, bills everything still un-invoiced.
 */
async function draft(order, { items = null, t } = {}) {
  if (['DRAFT', 'CANCELED'].includes(order.status))
    throw bad("Draft and cancelled orders can't be invoiced. Confirm the order first.");
  const remaining = await remainingToInvoice(order, t);
  const left = Object.fromEntries(remaining.map((r) => [r.productId, r.remaining]));
  let want = items
    ? items
        .map((i) => ({ productId: i.productId, quantity: Number(i.quantity) || 0 }))
        .filter((i) => i.productId && i.quantity > 0)
    : remaining
        .filter((r) => r.remaining > 0)
        .map((r) => ({ productId: r.productId, quantity: r.remaining }));
  // merge duplicates
  const merged = {};
  for (const w of want) merged[w.productId] = (merged[w.productId] || 0) + w.quantity;
  want = Object.entries(merged).map(([productId, quantity]) => ({ productId, quantity }));
  if (!want.length) throw bad('Everything on this order has already been invoiced.');
  for (const w of want) {
    if (left[w.productId] == null) throw bad('A product on the invoice is not on this order.');
    if (w.quantity > left[w.productId]) {
      throw bad(
        `Only ${left[w.productId]} piece(s) of a product are left to invoice on this order (asked for ${w.quantity}).`,
      );
    }
  }

  const orderLines = asList(order.products);
  const info = await productInfo(want.map((w) => w.productId));
  const lines = want.map((w) => {
    const src = orderLines.find((l) => pid(l) === w.productId) || {};
    const a = lineAmounts({ ...src, quantity: w.quantity });
    const p = info[w.productId] || {};
    return {
      productId: w.productId,
      name: p.name || src.name || 'Product',
      code: p.code || src.productCode || src.companyCode || null,
      hsn: p.hsn || null,
      unit: p.unit || 'PCS',
      qty: w.quantity,
      price: a.price,
      discount: a.discount,
      net: a.net,
      rate: a.rate,
    };
  });

  // Order-level money: freight on the first invoice, extra discount shared by value
  const { TaxInvoice } = m();
  const previous = await TaxInvoice.findAll({
    where: { orderId: order.id, status: 'ISSUED' },
    attributes: ['freight', 'discount', 'goodsValue'],
    transaction: t,
  });
  const orderTotals = quotationTotals({
    ...pricingFromRecord(order),
    items: orderLines,
    extraDiscount: order.extraDiscount || 0,
    extraDiscountType: order.extraDiscountType || 'fixed',
    shipping: order.shipping || 0,
    gstRate: Number(order.gst) || 0,
  });
  const freightBilled = previous.reduce((s, p) => s + Number(p.freight || 0), 0);
  const freight = freightBilled > 0 ? 0 : orderTotals.freight;
  const goodsValue = r2(lines.reduce((s, l) => s + l.net, 0));
  const isLast = remaining.every((r) => (merged[r.productId] || 0) >= r.remaining);
  let extraDiscount;
  if ((order.extraDiscountType || 'fixed').toLowerCase() === 'percent') {
    extraDiscount = r2(((goodsValue + freight) * Number(order.extraDiscount || 0)) / 100);
  } else {
    const total = orderTotals.extraDiscountAmount;
    const already = r2(previous.reduce((s, p) => s + Number(p.discount || 0), 0));
    extraDiscount = isLast
      ? r2(Math.max(total - already, 0))
      : orderTotals.goodsValue + orderTotals.freight > 0
        ? r2((total * (goodsValue + freight)) / (orderTotals.goodsValue + orderTotals.freight))
        : 0;
  }

  const p = await parties(order, t);
  const gstRate = Number(order.gst) || 0;
  const totals = quotationTotals({
    ...pricingFromRecord(order),
    items: lines.map((l) => ({ quantity: 1, price: l.net })), // each line's amount after its own discount
    extraDiscount,
    extraDiscountType: 'fixed',
    shipping: freight,
    gstRate,
    interState: p.interState,
  });
  // Spread the extra discount over the lines so each line has its taxable value (for the HSN summary)
  const base = goodsValue + freight;
  const factor = base > 0 ? totals.taxableValue / base : 1;
  let spread = 0;
  lines.forEach((l, i) => {
    l.taxable =
      i === lines.length - 1 && freight === 0
        ? r2(totals.taxableValue - spread)
        : r2(l.net * factor);
    spread = r2(spread + l.taxable);
  });
  const freightTaxable = freight > 0 ? r2(totals.taxableValue - spread) : 0;

  return {
    lines,
    freight,
    freightTaxable,
    goodsValue,
    discount: extraDiscount,
    taxableValue: totals.taxableValue,
    gstRate,
    cgst: totals.cgst,
    sgst: totals.sgst,
    igst: totals.igst,
    roundOff: totals.roundOff,
    total: totals.grandTotal,
    isLast,
    ...p,
  };
}

/** Saves an invoice for an order (optionally for one dispatch's pieces). */
async function createInvoice({
  orderId,
  dispatchId = null,
  items = null,
  invoiceDate = null,
  userId = null,
}) {
  const { sequelize, Order, OrderDispatch, TaxInvoice } = m();
  return sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) throw bad('Order not found', 404);
    let dispatch = null;
    if (dispatchId) {
      dispatch = await OrderDispatch.findOne({
        where: { id: dispatchId, orderId },
        transaction: t,
      });
      if (!dispatch) throw bad('Dispatch not found', 404);
      if (dispatch.status === 'RETURNED') throw bad('This dispatch was returned.');
      const existing = await TaxInvoice.findOne({
        where: { dispatchId, status: 'ISSUED' },
        transaction: t,
      });
      if (existing)
        throw bad(
          `Dispatch #${dispatch.dispatchNumber} already has invoice ${existing.invoiceNo}.`,
          409,
        );
      // Bill only the dispatched pieces that are not already on an invoice
      const left = Object.fromEntries(
        (await remainingToInvoice(order, t)).map((r) => [r.productId, r.remaining]),
      );
      items = asList(dispatch.items)
        .map((i) => ({
          productId: i.productId,
          quantity: Math.min(Number(i.quantity) || 0, left[i.productId] || 0),
        }))
        .filter((i) => i.quantity > 0);
      if (!items.length) throw bad('Every piece in this dispatch is already on an invoice.');
    }
    const d = await draft(order, { items, t });
    const date = invoiceDate ? String(invoiceDate).slice(0, 10) : todayIST();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw bad('Invoice date is not a valid date.');
    if (date > todayIST()) throw bad("Invoice date can't be in the future.");
    const fy = financialYear(date);
    const invoiceNo = await nextInvoiceNo(fy, t);
    const inv = await TaxInvoice.create(
      {
        invoiceNo,
        financialYear: fy,
        invoiceDate: date,
        orderId: order.id,
        orderNo: String(order.orderNo),
        dispatchId: dispatch?.id || null,
        customerId: d.customer?.customerId || null,
        customerName: d.billTo.name,
        customerGstin: d.billTo.gstin ? String(d.billTo.gstin).toUpperCase().slice(0, 15) : null,
        billTo: d.billTo,
        shipTo: d.shipTo,
        placeOfSupply: d.placeOfSupply,
        interState: d.interState,
        lines: d.lines,
        goodsValue: d.goodsValue,
        freight: d.freight,
        discount: d.discount,
        taxableValue: d.taxableValue,
        gstRate: d.gstRate,
        cgst: d.cgst,
        sgst: d.sgst,
        igst: d.igst,
        roundOff: d.roundOff,
        total: d.total,
        ewayBillNo: dispatch?.ewayBillNo || null,
        vehicleNo: dispatch?.vehicleNo || null,
        createdBy: userId,
      },
      { transaction: t },
    );
    // The order (and the dispatch) point at the invoice, so the closing rules see it.
    const link = publicLink(inv);
    if (!order.invoiceLink) order.invoiceLink = link;
    if (['PREPARING', 'CHECKING'].includes(order.status)) order.status = 'INVOICE';
    await order.save({ transaction: t });
    if (dispatch && !dispatch.invoiceLink)
      await dispatch.update({ invoiceLink: link }, { transaction: t });
    return inv;
  });
}

async function cancelInvoice(id, { reason, userId }) {
  const { TaxInvoice, Order, sequelize } = m();
  if (!String(reason || '').trim()) throw bad('Write why the invoice is being cancelled.');
  return sequelize.transaction(async (t) => {
    const inv = await TaxInvoice.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!inv) throw bad('Invoice not found', 404);
    if (inv.status === 'CANCELLED') throw bad('This invoice is already cancelled.');
    await inv.update(
      { status: 'CANCELLED', cancelReason: String(reason).trim(), cancelledAt: new Date() },
      { transaction: t },
    );
    // If the order pointed at this invoice, point it at the latest live one (or nothing)
    const order = await Order.findByPk(inv.orderId, { transaction: t });
    if (order && order.invoiceLink === publicLink(inv)) {
      const live = await TaxInvoice.findOne({
        where: { orderId: inv.orderId, status: 'ISSUED' },
        order: [['createdAt', 'DESC']],
        transaction: t,
      });
      order.invoiceLink = live ? publicLink(live) : null;
      await order.save({ transaction: t });
    }
    return inv;
  });
}

/** A signed link that opens the invoice PDF without logging in (for WhatsApp / email / order documents). */
function publicLink(inv) {
  const { signShare } = require('../../lib/shareToken');
  const base = (
    process.env.PUBLIC_BACKEND_URL || `http://localhost:${process.env.PORT || 5050}`
  ).replace(/\/+$/, '');
  // Invoices must stay openable for years (GST records are kept for 6 years)
  return `${base}/api/public/inv/${signShare({ t: 'inv', id: inv.id }, 365 * 8)}.pdf`;
}

module.exports = {
  financialYear,
  remainingToInvoice,
  invoicedQty,
  draft,
  createInvoice,
  cancelInvoice,
  publicLink,
  asList,
};
