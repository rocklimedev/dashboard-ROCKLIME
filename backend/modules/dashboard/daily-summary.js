// The owner's end-of-day summary: sales, dispatches, money in, and what needs
// attention tomorrow. Sent by email at 8 pm (Asia/Kolkata) to the addresses in
// Settings → Company & documents (daily summary), and viewable in the app.
const { QueryTypes } = require("sequelize");
const { getSetting } = require("../settings/settings.service");

const m = () => require("../../models");
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const istDate = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);

async function buildSummary(date = istDate()) {
  const { sequelize } = m();
  const q = (sql, r = {}) => sequelize.query(sql, { replacements: { from: `${date} 00:00:00`, to: `${date} 23:59:59`, date, ...r }, type: QueryTypes.SELECT });
  // Timestamps are stored as server time; for the local install that is IST.
  const [[orders], [quotes], [dispatches], [payments], [invoices], [won], [lost], [followTomorrow], [late]] = await Promise.all([
    q(`SELECT COUNT(*) n, COALESCE(SUM(finalAmount),0) v FROM orders WHERE status NOT IN ('DRAFT','CANCELED') AND createdAt BETWEEN :from AND :to`),
    q(`SELECT COUNT(*) n, COALESCE(SUM(finalAmount),0) v FROM quotations WHERE createdAt BETWEEN :from AND :to`),
    q(`SELECT COUNT(*) n, COALESCE(SUM(totalQuantity),0) pcs, COUNT(DISTINCT orderId) orders FROM order_dispatches WHERE createdAt BETWEEN :from AND :to`),
    q(`SELECT COUNT(*) n, COALESCE(SUM(amount),0) v FROM order_payments WHERE status = 'RECEIVED' AND receivedAt BETWEEN :from AND :to`),
    q(`SELECT COUNT(*) n, COALESCE(SUM(total),0) v FROM tax_invoices WHERE status = 'ISSUED' AND invoiceDate = :date`).catch(() => [{ n: 0, v: 0 }]),
    q(`SELECT COUNT(*) n, COALESCE(SUM(finalAmount),0) v FROM quotations WHERE status = 'WON' AND statusChangedAt BETWEEN :from AND :to`),
    q(`SELECT COUNT(*) n, COALESCE(SUM(finalAmount),0) v FROM quotations WHERE status = 'LOST' AND statusChangedAt BETWEEN :from AND :to`),
    q(`SELECT COUNT(*) n FROM quotations WHERE status IN ('DRAFT','SENT','NEGOTIATION') AND nextFollowUp <= DATE_ADD(:date, INTERVAL 1 DAY)`),
    q(`SELECT COUNT(*) n FROM orders WHERE dueDate < DATE_ADD(:date, INTERVAL 1 DAY) AND status IN ('PREPARING','CHECKING','INVOICE','PARTIALLY_DISPATCHED','ONHOLD')`),
  ]);
  const balances = await require("../payments/payment.controller").orderBalances();
  const due = balances.filter((b) => b.due > 0.009);
  const over30 = due.filter((b) => Date.now() - new Date(b.createdAt).getTime() > 30 * 864e5);
  const data = {
    date,
    orders: { count: Number(orders.n), value: Number(orders.v) },
    quotations: { count: Number(quotes.n), value: Number(quotes.v) },
    won: { count: Number(won.n), value: Number(won.v) },
    lost: { count: Number(lost.n), value: Number(lost.v) },
    dispatches: { count: Number(dispatches.n), pieces: Number(dispatches.pcs), orders: Number(dispatches.orders) },
    collected: { count: Number(payments.n), value: Number(payments.v) },
    invoiced: { count: Number(invoices.n), value: Number(invoices.v) },
    tomorrow: { followUps: Number(followTomorrow.n), dueOrLate: Number(late.n) },
    moneyDue: { total: due.reduce((a, b) => a + b.due, 0), over30: over30.reduce((a, b) => a + b.due, 0) },
  };
  const day = new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  const lines = [
    `CM Trading — ${day}`,
    "",
    `Orders: ${data.orders.count} worth ${inr(data.orders.value)}`,
    `Quotations: ${data.quotations.count} worth ${inr(data.quotations.value)} · won ${data.won.count}, lost ${data.lost.count}`,
    `Dispatched: ${data.dispatches.count} dispatch(es), ${data.dispatches.pieces} pieces`,
    `Collected: ${inr(data.collected.value)} (${data.collected.count} payment(s))`,
    `Invoiced: ${inr(data.invoiced.value)} (${data.invoiced.count} invoice(s))`,
    "",
    `Tomorrow: ${data.tomorrow.followUps} follow-up(s) due, ${data.tomorrow.dueOrLate} order(s) due or late`,
    `Money due: ${inr(data.moneyDue.total)} (over 30 days: ${inr(data.moneyDue.over30)})`,
  ];
  data.text = lines.join("\n");
  data.html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1f1f1f">
    <h2 style="color:#C8102E;margin:0 0 8px">CM Trading — ${day}</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${[
        ["Orders", `${data.orders.count} · ${inr(data.orders.value)}`],
        ["Quotations", `${data.quotations.count} · ${inr(data.quotations.value)} (won ${data.won.count}, lost ${data.lost.count})`],
        ["Dispatched", `${data.dispatches.count} dispatch(es), ${data.dispatches.pieces} pieces`],
        ["Collected", `${inr(data.collected.value)} (${data.collected.count})`],
        ["Invoiced", `${inr(data.invoiced.value)} (${data.invoiced.count})`],
        ["Tomorrow", `${data.tomorrow.followUps} follow-ups, ${data.tomorrow.dueOrLate} orders due or late`],
        ["Money due", `${inr(data.moneyDue.total)} · over 30 days ${inr(data.moneyDue.over30)}`],
      ]
        .map(([k, v]) => `<tr><td style="color:#6b6b6b;border-bottom:1px solid #eee">${k}</td><td style="border-bottom:1px solid #eee"><b>${v}</b></td></tr>`)
        .join("")}
    </table></div>`;
  return data;
}

async function sendSummary(date) {
  const company = await getSetting("company");
  const to = String(company.summaryEmails || "").split(/[,;\s]+/).filter((e) => /@/.test(e));
  if (!to.length) return { sent: false, reason: "No daily-summary email set in Settings → Company & documents." };
  const s = await buildSummary(date);
  const { sendMail } = require("../../middleware/sendMail");
  await sendMail(to.join(","), `Daily summary · ${s.date}`, s.text, s.html);
  return { sent: true, to };
}

module.exports = { buildSummary, sendSummary, istDate };
