// Accounts: payments received against orders and money due.
//
// Billed  = order final amount − credit notes (issued/received)
// Paid    = sum of RECEIVED payments
// Due     = Billed − Paid
// Draft and cancelled orders are not billed.
const { Op, QueryTypes } = require("sequelize");
const { r2 } = require("../../lib/quotationMath");

const m = () => require("../../models");
const fail = (res, err) => res.status(err.status || 500).json({ message: err.message || "Request failed" });
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });

const NOT_BILLED = ["DRAFT", "CANCELED"];
const MODES = ["CASH", "UPI", "BANK", "CHEQUE", "CARD", "OTHER"];

/** Billed / paid / due for a set of orders, computed in SQL. */
async function orderBalances({ orderIds = null, customerId = null, customerIds = null } = {}) {
  const { sequelize } = m();
  const where = ["o.status NOT IN (:notBilled)"];
  const repl = { notBilled: NOT_BILLED };
  if (orderIds) {
    if (!orderIds.length) return [];
    where.push("o.id IN (:orderIds)");
    repl.orderIds = orderIds;
  }
  if (customerId) {
    where.push("o.createdFor = :customerId");
    repl.customerId = customerId;
  }
  if (customerIds) {
    if (!customerIds.length) return [];
    where.push("o.createdFor IN (:customerIds)");
    repl.customerIds = customerIds;
  }
  return sequelize.query(
    `SELECT o.id, o.orderNo, o.status, o.createdAt, o.dueDate, o.createdFor AS customerId, c.name AS customerName,
            c.mobileNumber AS customerPhone,
            COALESCE(o.finalAmount, 0) AS orderAmount,
            COALESCE((SELECT SUM(cn.totalAmount) FROM order_credit_notes cn
                      WHERE cn.orderId = o.id AND cn.status IN ('ISSUED','RECEIVED')), 0) AS credited,
            COALESCE((SELECT SUM(p.amount) FROM order_payments p
                      WHERE p.orderId = o.id AND p.status = 'RECEIVED'), 0) AS paid
     FROM orders o
     LEFT JOIN customers c ON c.customerId = o.createdFor
     WHERE ${where.join(" AND ")}
     ORDER BY o.createdAt ASC`,
    { replacements: repl, type: QueryTypes.SELECT },
  ).then((rows) =>
    rows.map((r) => {
      const billed = r2(Number(r.orderAmount) - Number(r.credited));
      const paid = r2(Number(r.paid));
      return { ...r, orderAmount: Number(r.orderAmount), credited: Number(r.credited), billed, paid, due: r2(billed - paid) };
    }),
  );
}

const daysSince = (d) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5));

// GET /api/payments/due → money due by customer, with ageing (days since the order)
exports.due = async (req, res) => {
  try {
    const rows = (await orderBalances()).filter((o) => o.due > 0.009);
    const byCustomer = {};
    for (const o of rows) {
      const k = o.customerId || "none";
      if (!byCustomer[k]) {
        byCustomer[k] = {
          customerId: o.customerId,
          customerName: o.customerName || "No customer",
          customerPhone: o.customerPhone,
          orders: [],
          billed: 0,
          paid: 0,
          due: 0,
          ageing: { d0_30: 0, d31_60: 0, d61_90: 0, d90: 0 },
          oldestDays: 0,
        };
      }
      const c = byCustomer[k];
      const age = daysSince(o.createdAt);
      c.orders.push({ ...o, ageDays: age });
      c.billed = r2(c.billed + o.billed);
      c.paid = r2(c.paid + o.paid);
      c.due = r2(c.due + o.due);
      const bucket = age <= 30 ? "d0_30" : age <= 60 ? "d31_60" : age <= 90 ? "d61_90" : "d90";
      c.ageing[bucket] = r2(c.ageing[bucket] + o.due);
      c.oldestDays = Math.max(c.oldestDays, age);
    }
    const customers = Object.values(byCustomer).sort((a, b) => b.due - a.due);
    const totals = customers.reduce(
      (t, c) => ({
        due: r2(t.due + c.due),
        over30: r2(t.over30 + c.ageing.d31_60 + c.ageing.d61_90 + c.ageing.d90),
        over90: r2(t.over90 + c.ageing.d90),
        customers: t.customers + 1,
        orders: t.orders + c.orders.length,
      }),
      { due: 0, over30: 0, over90: 0, customers: 0, orders: 0 },
    );
    const { sequelize } = m();
    const [month] = await sequelize.query(
      `SELECT COALESCE(SUM(amount),0) AS collected, COUNT(*) AS n FROM order_payments
       WHERE status = 'RECEIVED' AND receivedAt >= :from`,
      { replacements: { from: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, type: QueryTypes.SELECT },
    );
    res.json({ customers, totals: { ...totals, collectedThisMonth: r2(Number(month.collected)), paymentsThisMonth: Number(month.n) } });
  } catch (err) {
    fail(res, err);
  }
};

// GET /api/payments?orderId=&customerId=&from=&to=&page=&limit=
exports.list = async (req, res) => {
  try {
    const { OrderPayment, Customer, User } = m();
    const where = {};
    if (req.query.orderId) where.orderId = req.query.orderId;
    if (req.query.customerId) where.customerId = req.query.customerId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.from || req.query.to) {
      where.receivedAt = {};
      if (req.query.from) where.receivedAt[Op.gte] = new Date(req.query.from);
      if (req.query.to) where.receivedAt[Op.lte] = new Date(`${req.query.to}T23:59:59`);
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
    const { rows, count } = await OrderPayment.findAndCountAll({
      where,
      order: [["receivedAt", "DESC"], ["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });
    const cids = [...new Set(rows.map((r) => r.customerId).filter(Boolean))];
    const uids = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
    const [cs, us] = await Promise.all([
      cids.length ? Customer.findAll({ where: { customerId: cids }, attributes: ["customerId", "name"] }) : [],
      uids.length ? User.findAll({ where: { userId: uids }, attributes: ["userId", "name", "username"] }) : [],
    ]);
    const cn = Object.fromEntries(cs.map((c) => [c.customerId, c.name]));
    const un = Object.fromEntries(us.map((u) => [u.userId, u.name || u.username]));
    res.json({
      data: rows.map((r) => ({ ...r.toJSON(), amount: Number(r.amount), customerName: cn[r.customerId] || null, recordedBy: un[r.userId] || null })),
      pagination: { page, limit, total: count },
    });
  } catch (err) {
    fail(res, err);
  }
};

// GET /api/payments/order/:orderId → billed / paid / due and the payments
exports.forOrder = async (req, res) => {
  try {
    const { Order, OrderPayment } = m();
    const order = await Order.findByPk(req.params.orderId, { attributes: ["id", "orderNo", "status", "finalAmount", "createdFor"] });
    if (!order) return res.status(404).json({ message: "Order not found" });
    const [bal] = await orderBalances({ orderIds: [order.id] });
    const payments = await OrderPayment.findAll({ where: { orderId: order.id }, order: [["receivedAt", "DESC"]] });
    res.json({
      orderId: order.id,
      orderNo: order.orderNo,
      billable: !NOT_BILLED.includes(order.status),
      billed: bal?.billed ?? 0,
      credited: bal?.credited ?? 0,
      paid: bal?.paid ?? 0,
      due: bal?.due ?? 0,
      payments: payments.map((p) => ({ ...p.toJSON(), amount: Number(p.amount) })),
    });
  } catch (err) {
    fail(res, err);
  }
};

async function nextReceiptNo(t) {
  const { OrderPayment } = m();
  const d = new Date();
  const stamp = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(2)}`;
  const n = await OrderPayment.count({ where: { receiptNo: { [Op.like]: `RCPT${stamp}%` } }, transaction: t });
  return `RCPT${stamp}${String(n + 1).padStart(3, "0")}`;
}

async function syncAmountPaid(orderId, t) {
  const { Order, OrderPayment } = m();
  const paid = (await OrderPayment.sum("amount", { where: { orderId, status: "RECEIVED" }, transaction: t })) || 0;
  await Order.update({ amountPaid: r2(paid) }, { where: { id: orderId }, transaction: t });
  return r2(paid);
}

// POST /api/payments { orderId, amount, mode, reference, receivedAt, notes }
exports.create = async (req, res) => {
  try {
    const { sequelize, Order, OrderPayment } = m();
    const result = await sequelize.transaction(async (t) => {
      const { orderId, mode = "UPI", reference, receivedAt, notes } = req.body || {};
      const amount = r2(Number(req.body?.amount));
      if (!orderId) throw bad("Choose the order this payment is for.");
      if (!(amount > 0)) throw bad("Enter the amount received.");
      if (!MODES.includes(String(mode).toUpperCase())) throw bad(`Mode must be one of ${MODES.join(", ")}.`);
      if (["CHEQUE", "BANK"].includes(String(mode).toUpperCase()) && !reference) throw bad("Enter the cheque number or bank reference.");
      const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!order) throw bad("Order not found", 404);
      if (NOT_BILLED.includes(order.status)) throw bad(`Payments cannot be recorded on a ${order.status.toLowerCase()} order.`);
      const [bal] = await orderBalances({ orderIds: [order.id] });
      if (amount > r2((bal?.due || 0) + 1)) {
        throw bad(`Only ₹${(bal?.due || 0).toLocaleString("en-IN")} is due on order ${order.orderNo}.`);
      }
      const when = receivedAt ? new Date(receivedAt) : new Date();
      if (when.getTime() > Date.now() + 864e5) throw bad("The payment date cannot be in the future.");
      const p = await OrderPayment.create(
        {
          receiptNo: await nextReceiptNo(t),
          orderId: order.id,
          orderNo: order.orderNo,
          customerId: order.createdFor,
          amount,
          mode: String(mode).toUpperCase(),
          reference: reference || null,
          receivedAt: when,
          notes: notes || null,
          userId: req.user.userId,
        },
        { transaction: t },
      );
      const paid = await syncAmountPaid(order.id, t);
      return { payment: p, paid, due: r2((bal?.billed || 0) - paid) };
    });
    try {
      const logOrderActivity = require("../orders/order-activity-logger");
      await logOrderActivity({
        orderId: result.payment.orderId,
        orderNo: result.payment.orderNo,
        action: "PAYMENT_RECEIVED",
        description: `Payment ${result.payment.receiptNo} of ₹${Number(result.payment.amount).toLocaleString("en-IN")} received (${result.payment.mode})`,
        performedBy: req.user.userId,
      });
    } catch {
      /* activity log is best-effort */
    }
    res.status(201).json({ message: `Payment recorded (${result.payment.receiptNo})`, ...result });
  } catch (err) {
    fail(res, err);
  }
};

// POST /api/payments/:id/cancel { reason } — bounced cheque, wrong entry
exports.cancel = async (req, res) => {
  try {
    const { sequelize, OrderPayment } = m();
    const reason = String(req.body?.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "A reason is required." });
    const out = await sequelize.transaction(async (t) => {
      const p = await OrderPayment.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!p) throw bad("Payment not found", 404);
      if (p.status !== "RECEIVED") throw bad("This payment is already cancelled.");
      await p.update({ status: "CANCELLED", cancelReason: reason }, { transaction: t });
      const paid = await syncAmountPaid(p.orderId, t);
      return { payment: p, paid };
    });
    res.json({ message: "Payment cancelled", ...out });
  } catch (err) {
    fail(res, err);
  }
};

exports.orderBalances = orderBalances;
exports.MODES = MODES;
exports.orderBalances = orderBalances;
