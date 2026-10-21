const { asList } = require('./dispatch-document');
const { enrichQuotation, renderQuotationPdf } = require('../quotations/quotation-pdf');
const { getSetting } = require('../settings/settings.service');

function orderDocument(order) {
  return {
    quotation: {
      customerId: order.createdFor,
      createdBy: order.createdBy,
      shipTo: order.shipTo,
      reference_number: String(order.orderNo),
      document_title: order.description || '',
      quotation_date: order.createdAt,
      due_date: order.dueDate,
      shippingAmount: order.shipping,
      gst: order.gst,
      extraDiscount: order.extraDiscount,
      extraDiscountType: order.extraDiscountType || 'fixed',
      floors: order.floors || [],
    },
    // Saved order line totals are authoritative, including negotiated prices.
    items: asList(order.products).map((item) => {
      const qty = Number(item.quantity ?? item.qty ?? 1);
      const total = Number(item.total);
      if (item.total == null || !Number.isFinite(total) || !qty) return item;
      return { ...item, flatPrice: total / qty + (Number(item.additionalDiscount) || 0) };
    }),
  };
}

async function pdf(req, res) {
  try {
    const { Order } = require('../../models');
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    let exportOptions;
    try {
      exportOptions = JSON.parse(req.query.exportOptions || '{}');
    } catch {
      return res.status(400).json({ message: 'Invalid export options' });
    }
    const source = orderDocument(order);
    const [data, company, settings] = await Promise.all([
      enrichQuotation(source.quotation, source.items),
      getSetting('company'),
      getSetting('quotation'),
    ]);
    const { buffer, filename, pageLabels } = await renderQuotationPdf(data, {
      company,
      settings,
      documentLabel: 'Order',
      style: req.query.style,
      cover: false,
      exportOptions,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Order-${filename.replace(/["\r\n/\\]/g, '-')}"`,
    );
    res.setHeader('X-Quotation-Pages', encodeURIComponent(JSON.stringify(pageLabels)));
    res.send(buffer);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}

module.exports = { orderDocument, pdf };
