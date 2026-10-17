// Dashboard numbers counted in SQL for a date range, instead of downloading
// hundreds of orders and quotations to the browser and counting there.
const { Op, fn, col, literal } = require("sequelize");
const { Order, Quotation, Customer, Product } = require("../../models");

// Orders that count towards sales (not drafts, not cancelled)
const COUNTED = { [Op.notIn]: ["DRAFT", "CANCELED"] };
// Confirmed but not yet fully dispatched
const IN_PROGRESS = ["PREPARING", "CHECKING", "INVOICE", "PARTIALLY_DISPATCHED", "ONHOLD"];

const parseDate = (v, fallback) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : fallback;
};

const pctChange = (now, before) =>
  before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null;

async function totals(from, to) {
  const range = { [Op.between]: [from, to] };
  const [orderRow, quoteRow, converted] = await Promise.all([
    Order.findOne({
      attributes: [
        [fn("COUNT", col("id")), "count"],
        [fn("COALESCE", fn("SUM", col("finalAmount")), 0), "amount"],
      ],
      where: { createdAt: range, status: COUNTED },
      raw: true,
    }),
    Quotation.findOne({
      attributes: [
        [fn("COUNT", col("quotationId")), "count"],
        [fn("COALESCE", fn("SUM", col("finalAmount")), 0), "amount"],
      ],
      where: { createdAt: range },
      raw: true,
    }),
    // Quotations from this range that have at least one live order
    Quotation.count({
      where: {
        createdAt: range,
        quotationId: {
          [Op.in]: literal(
            "(SELECT quotationId FROM orders WHERE quotationId IS NOT NULL AND status <> 'CANCELED')",
          ),
        },
      },
    }),
  ]);
  return {
    orders: Number(orderRow?.count || 0),
    orderAmount: Number(orderRow?.amount || 0),
    quotations: Number(quoteRow?.count || 0),
    quotationAmount: Number(quoteRow?.amount || 0),
    converted,
  };
}

exports.getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const to = parseDate(req.query.to, now);
    const from = parseDate(req.query.from, new Date(to.getTime() - 6 * 864e5));
    const span = to.getTime() - from.getTime();
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const latestLimit = Math.min(Math.max(Number(req.query.latest) || 5, 1), 10);
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - span);

    const [cur, prev, inProgress, daily, latestOrders, latestQuotations, lowStock] =
      await Promise.all([
        totals(from, to),
        totals(prevFrom, prevTo),
        Order.count({ where: { status: { [Op.in]: IN_PROGRESS } } }),
        // Last 7 days ending at `to`, one row per day
        (async () => {
          const start = new Date(to);
          start.setHours(0, 0, 0, 0);
          start.setDate(start.getDate() - (days - 1));
          const day = fn("DATE", col("createdAt"));
          const [o, q] = await Promise.all([
            Order.findAll({
              attributes: [[day, "day"], [fn("COUNT", col("id")), "n"]],
              where: { createdAt: { [Op.between]: [start, to] }, status: COUNTED },
              group: [day],
              raw: true,
            }),
            Quotation.findAll({
              attributes: [[day, "day"], [fn("COUNT", col("quotationId")), "n"]],
              where: { createdAt: { [Op.between]: [start, to] } },
              group: [day],
              raw: true,
            }),
          ]);
          const key = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));
          const om = Object.fromEntries(o.map((r) => [key(r.day), Number(r.n)]));
          const qm = Object.fromEntries(q.map((r) => [key(r.day), Number(r.n)]));
          return Array.from({ length: days }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return { date: k, orders: om[k] || 0, quotations: qm[k] || 0 };
          });
        })(),
        Order.findAll({
          attributes: ["id", "orderNo", "status", "finalAmount", "createdAt"],
          where: { createdAt: { [Op.between]: [from, to] } },
          include: [{ model: Customer, as: "customer", attributes: ["customerId", "name"] }],
          order: [["createdAt", "DESC"]],
          limit: latestLimit,
        }),
        Quotation.findAll({
          attributes: ["quotationId", "reference_number", "document_title", "finalAmount", "createdAt", "customerId"],
          where: { createdAt: { [Op.between]: [from, to] } },
          include: [{ model: Customer, as: "customer", attributes: ["customerId", "name"], required: false }],
          order: [["createdAt", "DESC"]],
          limit: latestLimit,
        }),
        // Low stock = at or below the product's own alert quantity, or 10 if none is set
        Product.count({
          where: literal("quantity <= COALESCE(NULLIF(alert_quantity, 0), 10)"),
        }),
      ]);

    const range = { [Op.between]: [from, to] };
    const [statusRows, lowStockItems, topOrderRows, topQuoteRows] = await Promise.all([
      Order.findAll({
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        where: { createdAt: range },
        group: ["status"],
        raw: true,
      }),
      Product.findAll({
        attributes: ["productId", "name", "product_code", "quantity", "alert_quantity"],
        where: literal("quantity <= COALESCE(NULLIF(alert_quantity, 0), 10)"),
        order: [["quantity", "ASC"]],
        limit: 8,
      }),
      Order.findAll({
        attributes: ["createdFor", [fn("COUNT", col("id")), "orders"], [fn("SUM", col("finalAmount")), "orderValue"]],
        where: { createdAt: range, status: COUNTED },
        group: ["createdFor"],
        raw: true,
      }),
      Quotation.findAll({
        attributes: ["customerId", [fn("COUNT", col("quotationId")), "quotations"], [fn("SUM", col("finalAmount")), "quoteValue"]],
        where: { createdAt: range },
        group: ["customerId"],
        raw: true,
      }),
    ]);
    const byCustomer = {};
    const row = (id) => (byCustomer[id] ||= { customerId: id, orders: 0, orderValue: 0, quotations: 0, quoteValue: 0 });
    topOrderRows.forEach((r) => { if (r.createdFor) Object.assign(row(r.createdFor), { orders: Number(r.orders), orderValue: Number(r.orderValue || 0) }); });
    topQuoteRows.forEach((r) => { if (r.customerId) Object.assign(row(r.customerId), { quotations: Number(r.quotations), quoteValue: Number(r.quoteValue || 0) }); });
    const top = Object.values(byCustomer)
      .sort((a, b) => b.orderValue + b.quoteValue - (a.orderValue + a.quoteValue))
      .slice(0, 7);
    const names = top.length
      ? await Customer.findAll({ attributes: ["customerId", "name"], where: { customerId: top.map((t) => t.customerId) }, raw: true })
      : [];
    const nameOf = Object.fromEntries(names.map((n) => [n.customerId, n.name]));
    top.forEach((t) => { t.name = nameOf[t.customerId] || "Unknown"; });

    res.json({
      statusBreakdown: statusRows.map((r) => ({ status: r.status, count: Number(r.count) })),
      lowStockItems,
      topCustomers: top,
      period: { from, to, previousFrom: prevFrom, previousTo: prevTo },
      orders: {
        count: cur.orders,
        amount: cur.orderAmount,
        inProgress,
        change: pctChange(cur.orders, prev.orders),
        amountChange: pctChange(cur.orderAmount, prev.orderAmount),
      },
      quotations: {
        count: cur.quotations,
        amount: cur.quotationAmount,
        converted: cur.converted,
        change: pctChange(cur.quotations, prev.quotations),
      },
      conversionRate: cur.quotations ? Math.round((cur.converted / cur.quotations) * 100) : 0,
      daily,
      latestOrders,
      latestQuotations,
      lowStock: { count: lowStock },
    });
  } catch (err) {
    next(err);
  }
};
