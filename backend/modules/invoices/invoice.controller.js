const { Op } = require("sequelize");
const svc = require("./invoice.service");
const { buildInvoicePdf } = require("./invoice-pdf");
const { tallyXml, registerCsv } = require("./tally");
const logActivity = require("../../utils/activityLogger");

const m = () => require("../../models");
const fail = (res, err) => res.status(err.status || 500).json({ message: err.message || "Request failed" });
const toJSON = (i) => {
  const x = typeof i.toJSON === "function" ? i.toJSON() : i;
  for (const k of ["goodsValue", "freight", "discount", "taxableValue", "gstRate", "cgst", "sgst", "igst", "roundOff", "total"]) x[k] = Number(x[k]);
  x.lines = svc.asList(x.lines);
  return x;
};
const ymd = (s, fallback) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? String(s) : fallback);

// GET /api/invoices?from&to&customerId&status&search&page&limit
exports.list = async (req, res) => {
  try {
    const { TaxInvoice } = m();
    const where = {};
    if (req.query.from || req.query.to) {
      where.invoiceDate = {};
      if (req.query.from) where.invoiceDate[Op.gte] = ymd(req.query.from);
      if (req.query.to) where.invoiceDate[Op.lte] = ymd(req.query.to);
    }
    if (req.query.customerId) where.customerId = req.query.customerId;
    if (req.query.orderId) where.orderId = req.query.orderId;
    if (req.query.status) where.status = String(req.query.status).toUpperCase();
    if (req.query.search) {
      const s = `%${String(req.query.search).trim()}%`;
      where[Op.or] = [{ invoiceNo: { [Op.like]: s } }, { customerName: { [Op.like]: s } }, { orderNo: { [Op.like]: s } }, { customerGstin: { [Op.like]: s } }];
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
    const { count, rows } = await TaxInvoice.findAndCountAll({ where, order: [["invoiceDate", "DESC"], ["invoiceNo", "DESC"]], offset: (page - 1) * limit, limit });
    const live = await TaxInvoice.findAll({
      where: { ...where, status: "ISSUED" },
      attributes: [
        [m().sequelize.fn("SUM", m().sequelize.col("taxableValue")), "taxable"],
        [m().sequelize.fn("SUM", m().sequelize.col("cgst")), "cgst"],
        [m().sequelize.fn("SUM", m().sequelize.col("sgst")), "sgst"],
        [m().sequelize.fn("SUM", m().sequelize.col("igst")), "igst"],
        [m().sequelize.fn("SUM", m().sequelize.col("total")), "total"],
        [m().sequelize.fn("COUNT", m().sequelize.col("id")), "count"],
      ],
      raw: true,
    });
    const t = live[0] || {};
    res.json({
      data: rows.map(toJSON),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
      totals: {
        count: Number(t.count || 0),
        taxable: Number(t.taxable || 0),
        cgst: Number(t.cgst || 0),
        sgst: Number(t.sgst || 0),
        igst: Number(t.igst || 0),
        total: Number(t.total || 0),
      },
    });
  } catch (err) {
    fail(res, err);
  }
};

// GET /api/invoices/order/:orderId → its invoices and what is left to bill
exports.forOrder = async (req, res) => {
  try {
    const { TaxInvoice, Order } = m();
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const invoices = await TaxInvoice.findAll({ where: { orderId: order.id }, order: [["createdAt", "DESC"]] });
    const remaining = await svc.remainingToInvoice(order);
    res.json({
      invoices: invoices.map(toJSON),
      remaining,
      canInvoice: !["DRAFT", "CANCELED"].includes(order.status) && remaining.some((r) => r.remaining > 0),
    });
  } catch (err) {
    fail(res, err);
  }
};

// POST /api/invoices/preview { orderId, dispatchId?, items? } → the figures, nothing saved
exports.preview = async (req, res) => {
  try {
    const { Order, OrderDispatch } = m();
    const order = await Order.findByPk(req.body?.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    let items = req.body?.items || null;
    if (req.body?.dispatchId) {
      const d = await OrderDispatch.findOne({ where: { id: req.body.dispatchId, orderId: order.id } });
      if (!d) return res.status(404).json({ message: "Dispatch not found" });
      items = svc.asList(d.items).map((i) => ({ productId: i.productId, quantity: i.quantity }));
    }
    const d = await svc.draft(order, { items });
    delete d.customer;
    delete d.company;
    res.json(d);
  } catch (err) {
    fail(res, err);
  }
};

// POST /api/invoices { orderId, dispatchId?, items?, invoiceDate? }
exports.create = async (req, res) => {
  try {
    const inv = await svc.createInvoice({
      orderId: req.body?.orderId,
      dispatchId: req.body?.dispatchId || null,
      items: Array.isArray(req.body?.items) && req.body.items.length ? req.body.items : null,
      invoiceDate: req.body?.invoiceDate || null,
      userId: req.user?.userId,
    });
    await logActivity({
      userId: req.user?.userId,
      contextTag: "ACCOUNTS",
      subContext: "INVOICE",
      action: "INVOICE_CREATED",
      entityId: inv.id,
      entityName: inv.invoiceNo,
      description: `Tax invoice ${inv.invoiceNo} for order ${inv.orderNo}: ₹${Number(inv.total).toLocaleString("en-IN")}`,
      req,
    }).catch(() => {});
    res.status(201).json({ message: `Invoice ${inv.invoiceNo} created`, invoice: toJSON(inv), link: svc.publicLink(inv) });
  } catch (err) {
    fail(res, err);
  }
};

// POST /api/invoices/:id/cancel { reason }
exports.cancel = async (req, res) => {
  try {
    const inv = await svc.cancelInvoice(req.params.id, { reason: req.body?.reason, userId: req.user?.userId });
    await logActivity({
      userId: req.user?.userId,
      contextTag: "ACCOUNTS",
      subContext: "INVOICE",
      action: "INVOICE_CANCELLED",
      entityId: inv.id,
      entityName: inv.invoiceNo,
      description: `Tax invoice ${inv.invoiceNo} cancelled: ${inv.cancelReason}`,
      req,
    }).catch(() => {});
    res.json({ message: `Invoice ${inv.invoiceNo} cancelled`, invoice: toJSON(inv) });
  } catch (err) {
    fail(res, err);
  }
};

// GET /api/invoices/:id
exports.get = async (req, res) => {
  try {
    const inv = await m().TaxInvoice.findByPk(req.params.id);
    if (!inv) return res.status(404).json({ message: "Invoice not found" });
    res.json({ invoice: toJSON(inv), link: svc.publicLink(inv) });
  } catch (err) {
    fail(res, err);
  }
};

// GET /api/invoices/:id/pdf
exports.pdf = async (req, res) => {
  try {
    const { buffer, filename } = await buildInvoicePdf(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${req.query.download ? "attachment" : "inline"}; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (err) {
    fail(res, err);
  }
};

const range = (req) => {
  const now = new Date();
  const fyStart = `${now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1}-04-01`;
  const from = ymd(req.query.from, fyStart);
  const to = ymd(req.query.to, new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10));
  if (from > to) throw Object.assign(new Error("The start date is after the end date."), { status: 400 });
  return { from, to };
};

// GET /api/invoices/export/tally?from&to → XML for Tally import
exports.exportTally = async (req, res) => {
  try {
    const { from, to } = range(req);
    const { xml, invoices, payments } = await tallyXml({ from, to });
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="Tally-vouchers-${from}-to-${to}.xml"`);
    res.setHeader("X-Voucher-Count", `${invoices} sales, ${payments} receipts`);
    res.send(xml);
  } catch (err) {
    fail(res, err);
  }
};

// GET /api/invoices/export/register?from&to → CSV invoice register
exports.exportRegister = async (req, res) => {
  try {
    const { from, to } = range(req);
    const csv = await registerCsv({ from, to });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-register-${from}-to-${to}.csv"`);
    res.send(csv);
  } catch (err) {
    fail(res, err);
  }
};
