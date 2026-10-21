// Customer 360: everything about one customer on one screen — what they were
// quoted, what they ordered, what they paid and still owe (with credit limit),
// who referred them and whom they referred, and a single timeline.
const { QueryTypes } = require('sequelize');
const { r2 } = require('../../lib/quotationMath');

const m = () => require('../../models');
const daysSince = (d) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5));

async function overview(customerId) {
  const { sequelize, Customer } = m();
  const customer = await Customer.findByPk(customerId);
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  const q = (sql, r = {}) =>
    sequelize.query(sql, { replacements: { id: customerId, ...r }, type: QueryTypes.SELECT });

  const [quotes, orders, payments, invoices, dispatches, referrer, referrals] = await Promise.all([
    q(`SELECT quotationId, reference_number, document_title, finalAmount, status, lostReason, quotation_date, createdAt, statusChangedAt, nextFollowUp
       FROM quotations WHERE customerId = :id ORDER BY createdAt DESC`),
    q(
      `SELECT id, orderNo, status, finalAmount, createdAt, dueDate FROM orders WHERE createdFor = :id ORDER BY createdAt DESC`,
    ),
    q(
      `SELECT id, receiptNo, orderId, orderNo, amount, mode, reference, receivedAt, status FROM order_payments WHERE customerId = :id ORDER BY receivedAt DESC`,
    ).catch(() => []),
    q(
      `SELECT id, invoiceNo, invoiceDate, orderId, orderNo, total, status FROM tax_invoices WHERE customerId = :id ORDER BY invoiceDate DESC`,
    ).catch(() => []),
    q(`SELECT d.id, d.orderId, d.orderNo, d.dispatchNumber, d.totalQuantity, d.status, d.createdAt, d.deliveredAt
       FROM order_dispatches d JOIN orders o ON o.id = d.orderId WHERE o.createdFor = :id ORDER BY d.createdAt DESC`),
    customer.referredBy
      ? Customer.findByPk(customer.referredBy, {
          attributes: ['customerId', 'name', 'customerType', 'mobileNumber'],
        })
      : null,
    q(`SELECT c.customerId, c.name, c.customerType,
              (SELECT COALESCE(SUM(o.finalAmount),0) FROM orders o WHERE o.createdFor = c.customerId AND o.status NOT IN ('DRAFT','CANCELED')) AS orderValue,
              (SELECT COUNT(*) FROM orders o WHERE o.createdFor = c.customerId AND o.status NOT IN ('DRAFT','CANCELED')) AS orders
       FROM customers c WHERE c.referredBy = :id ORDER BY orderValue DESC`),
  ]);

  const balances = await require('../payments/payment.controller').orderBalances({ customerId });
  const live = orders.filter((o) => !['DRAFT', 'CANCELED'].includes(o.status));
  const billed = r2(balances.reduce((a, b) => a + b.billed, 0));
  const paid = r2(balances.reduce((a, b) => a + b.paid, 0));
  const due = r2(balances.reduce((a, b) => a + Math.max(b.due, 0), 0));
  const creditDays = Number(customer.creditDays) || 30;
  const overdue = r2(
    balances
      .filter((b) => b.due > 0.009 && daysSince(b.createdAt) > creditDays)
      .reduce((a, b) => a + b.due, 0),
  );
  const won = quotes.filter((x) => x.status === 'WON').length;
  const lost = quotes.filter((x) => x.status === 'LOST').length;
  const expired = quotes.filter((x) => x.status === 'EXPIRED').length;
  const open = quotes.filter((x) => ['DRAFT', 'SENT', 'NEGOTIATION'].includes(x.status));
  const limit = Number(customer.creditLimit) || 0;

  const timeline = [
    ...quotes.map((x) => ({
      at: x.createdAt,
      type: 'quotation',
      id: x.quotationId,
      title: `Quotation ${x.reference_number}`,
      detail: `${x.status.toLowerCase()} · ₹${Math.round(x.finalAmount || 0).toLocaleString('en-IN')}`,
    })),
    ...orders.map((x) => ({
      at: x.createdAt,
      type: 'order',
      id: x.id,
      title: `Order #${x.orderNo}`,
      detail: `${x.status.replace(/_/g, ' ').toLowerCase()} · ₹${Math.round(x.finalAmount || 0).toLocaleString('en-IN')}`,
    })),
    ...payments.map((x) => ({
      at: x.receivedAt,
      type: 'payment',
      id: x.orderId,
      title: `Payment ${x.receiptNo}`,
      detail: `${x.status === 'RECEIVED' ? '' : 'cancelled · '}₹${Math.round(x.amount).toLocaleString('en-IN')} ${x.mode}`,
    })),
    ...invoices.map((x) => ({
      at: x.invoiceDate,
      type: 'invoice',
      id: x.orderId,
      title: `Invoice ${x.invoiceNo}`,
      detail: `${x.status === 'ISSUED' ? '' : 'cancelled · '}₹${Math.round(x.total).toLocaleString('en-IN')}`,
    })),
    ...dispatches.map((x) => ({
      at: x.createdAt,
      type: 'dispatch',
      id: x.orderId,
      title: `Dispatch #${x.dispatchNumber} of order ${x.orderNo}`,
      detail: `${x.totalQuantity} pcs · ${x.status.toLowerCase()}`,
    })),
  ]
    .filter((e) => e.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 60);

  return {
    customer: customer.toJSON(),
    referrer: referrer ? referrer.toJSON() : null,
    referrals: referrals.map((r) => ({
      ...r,
      orderValue: Number(r.orderValue),
      orders: Number(r.orders),
    })),
    stats: {
      quotations: quotes.length,
      openQuotations: open.length,
      openValue: r2(open.reduce((a, x) => a + Number(x.finalAmount || 0), 0)),
      won,
      lost,
      winRate: won + lost + expired ? Math.round((won / (won + lost + expired)) * 100) : null,
      orders: live.length,
      orderValue: r2(live.reduce((a, o) => a + Number(o.finalAmount || 0), 0)),
      firstOrder: live.length ? live[live.length - 1].createdAt : null,
      lastOrder: live.length ? live[0].createdAt : null,
      billed,
      paid,
      due,
      overdue,
      creditLimit: limit || null,
      creditDays,
      creditLeft: limit ? r2(limit - due) : null,
      overLimit: limit ? due > limit : false,
    },
    quotations: quotes,
    orders,
    payments,
    invoices,
    timeline,
  };
}

/** Quick credit check for an order form: due now, limit, and whether a new amount would go over. */
async function creditCheck(customerId, amount = 0) {
  const { Customer } = m();
  const c = await Customer.findByPk(customerId, {
    attributes: ['customerId', 'name', 'creditLimit', 'creditDays'],
  });
  if (!c) throw Object.assign(new Error('Customer not found'), { status: 404 });
  const balances = await require('../payments/payment.controller').orderBalances({ customerId });
  const due = r2(balances.reduce((a, b) => a + Math.max(b.due, 0), 0));
  const days = Number(c.creditDays) || 30;
  const overdue = r2(
    balances
      .filter((b) => b.due > 0.009 && daysSince(b.createdAt) > days)
      .reduce((a, b) => a + b.due, 0),
  );
  const limit = Number(c.creditLimit) || 0;
  return {
    customerId,
    name: c.name,
    due,
    overdue,
    creditDays: days,
    creditLimit: limit || null,
    afterOrder: r2(due + Number(amount || 0)),
    overLimit: limit ? due + Number(amount || 0) > limit : false,
  };
}

module.exports = { overview, creditCheck };
