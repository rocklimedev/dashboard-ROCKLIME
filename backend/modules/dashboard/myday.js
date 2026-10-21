// "My day" on the Home screen: the short list of things that need doing today.
// Admins and managers see everyone's work; others see their own.
const { QueryTypes } = require('sequelize');
const { can } = require('../../middleware/permission');

const m = () => require('../../models');
const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'];
const OPEN_Q = "('DRAFT','SENT','NEGOTIATION')";
const TO_DISPATCH = "('PREPARING','CHECKING','INVOICE','PARTIALLY_DISPATCHED')";
const NOT_LATE = "('DISPATCHED','DELIVERED','PARTIALLY_DELIVERED','CLOSED','CANCELED','RETURNED')";

async function myDay(req, res) {
  try {
    const { sequelize } = m();
    const roles = req.user.roles || [];
    const everyone = roles.some((r) => ADMIN.includes(r)) || req.query.scope === 'all';
    const uid = req.user.userId;
    const q = (sql, replacements = {}) =>
      sequelize.query(sql, { replacements: { uid, ...replacements }, type: QueryTypes.SELECT });
    const validityDays = await require('../quotations/pipeline').validityDays();
    const mineQ = everyone ? '' : 'AND q.createdBy = :uid';
    const mineO = everyone
      ? ''
      : 'AND (o.createdBy = :uid OR o.assignedUserId = :uid OR o.secondaryUserId = :uid)';
    const [canQuotes, canOrders, canMoney, canStock, canPurchase, canCrm] = await Promise.all([
      can(req.user, 'quotations', 'view'),
      can(req.user, 'orders', 'view'),
      can(req.user, 'orders', 'edit'),
      can(req.user, 'inventory', 'view'),
      can(req.user, 'purchase_orders', 'view'),
      can(req.user, 'crm', 'view'),
    ]);

    const out = { scope: everyone ? 'everyone' : 'mine' };

    if (canQuotes) {
      await require('../quotations/pipeline')
        .expireOverdue()
        .catch(() => {});
      out.followUps = await q(
        `SELECT q.quotationId, q.reference_number, q.document_title, q.finalAmount, q.status, q.nextFollowUp,
                c.name AS customerName, c.mobileNumber AS customerPhone
         FROM quotations q LEFT JOIN customers c ON c.customerId = q.customerId
         WHERE q.status IN ${OPEN_Q} AND q.nextFollowUp IS NOT NULL AND q.nextFollowUp <= CURDATE() ${mineQ}
         ORDER BY q.nextFollowUp ASC LIMIT 8`,
      );
      out.expiring = await q(
        `SELECT q.quotationId, q.reference_number, q.finalAmount, q.status, c.name AS customerName,
                COALESCE(q.due_date, DATE_ADD(DATE(q.quotation_date), INTERVAL :days DAY)) AS validTill
         FROM quotations q LEFT JOIN customers c ON c.customerId = q.customerId
         WHERE q.status IN ${OPEN_Q}
           AND COALESCE(q.due_date, DATE_ADD(DATE(q.quotation_date), INTERVAL :days DAY)) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) ${mineQ}
         ORDER BY validTill ASC LIMIT 8`,
        { days: validityDays },
      );
      const [{ n }] = await q(
        `SELECT COUNT(*) AS n FROM quotations q WHERE q.status IN ${OPEN_Q} AND q.nextFollowUp IS NULL ${mineQ}`,
      );
      out.noFollowUp = Number(n);
      const [{ due, open }] = await q(
        `SELECT SUM(q.nextFollowUp IS NOT NULL AND q.nextFollowUp <= CURDATE()) AS due, COUNT(*) AS open
         FROM quotations q WHERE q.status IN ${OPEN_Q} ${mineQ}`,
      );
      out.quoteCounts = { followUpsDue: Number(due) || 0, open: Number(open) || 0 };
    }

    if (canCrm) {
      // CRM follow-ups due today or late
      out.crmFollowUps = await require('../crm/crm.service')
        .tasks({ userId: uid, scope: everyone ? 'all' : 'mine', when: 'due' })
        .then((rows) => rows.slice(0, 6))
        .catch(() => []);
    }

    if (canOrders) {
      out.toDispatch = await q(
        `SELECT o.id, o.orderNo, o.status, o.dueDate, o.priority, o.finalAmount, c.name AS customerName
         FROM orders o LEFT JOIN customers c ON c.customerId = o.createdFor
         WHERE o.status IN ${TO_DISPATCH} ${mineO}
         ORDER BY (o.dueDate IS NULL), o.dueDate ASC, FIELD(o.priority,'high','medium','low') LIMIT 8`,
      );
      const [{ n: dispatchCount }] = await q(
        `SELECT COUNT(*) AS n FROM orders o WHERE o.status IN ${TO_DISPATCH} ${mineO}`,
      );
      const [{ n: lateCount }] = await q(
        `SELECT COUNT(*) AS n FROM orders o WHERE o.dueDate < CURDATE() AND o.status NOT IN ${NOT_LATE} ${mineO}`,
      );
      const [{ n: deliverCount }] = await q(
        `SELECT COUNT(*) AS n FROM orders o WHERE o.status IN ('DISPATCHED','PARTIALLY_DELIVERED') ${mineO}`,
      );
      out.counts = {
        toDispatch: Number(dispatchCount),
        late: Number(lateCount),
        awaitingDelivery: Number(deliverCount),
      };
    }

    if (canMoney) {
      const rows = (await require('../payments/payment.controller').orderBalances()).filter(
        (o) => o.due > 0.009,
      );
      const old = rows.filter((o) => Date.now() - new Date(o.createdAt).getTime() > 30 * 864e5);
      out.money = {
        due: Math.round(rows.reduce((a, o) => a + o.due, 0)),
        over30: Math.round(old.reduce((a, o) => a + o.due, 0)),
        customersOver30: new Set(old.map((o) => o.customerId)).size,
      };
    }

    if (canPurchase) {
      out.arriving = await q(
        `SELECT po.id, po.poNumber, po.status, po.expectDeliveryDate, po.totalAmount, v.vendorName
         FROM purchase_orders po LEFT JOIN vendors v ON v.id = po.vendorId
         WHERE po.status IN ('confirmed','partial_delivered') AND po.expectDeliveryDate IS NOT NULL
           AND po.expectDeliveryDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         ORDER BY po.expectDeliveryDate ASC LIMIT 6`,
      ).catch(() => []);
      const [{ n: toReceive }] = await q(
        "SELECT COUNT(*) AS n FROM purchase_orders WHERE status IN ('confirmed','partial_delivered')",
      ).catch(() => [{ n: 0 }]);
      out.toReceive = Number(toReceive);
    }

    if (canStock) {
      const [{ n: low }] = await q(
        `SELECT COUNT(*) AS n FROM (
           SELECT p.productId FROM products p LEFT JOIN stock_balances b ON b.productId = p.productId
           WHERE p.status IS NULL OR p.status <> 'inactive'
           GROUP BY p.productId
           HAVING (SUM(COALESCE(b.onHand,0)) - SUM(COALESCE(b.reserved,0))) <= COALESCE(NULLIF(MAX(p.alert_quantity),0),10)
              AND SUM(COALESCE(b.incoming,0)) = 0
         ) t`,
      ).catch(() => [{ n: 0 }]);
      out.lowStockNoIncoming = Number(low);
    }

    res.json(out);
  } catch (err) {
    res.status(500).json({ message: 'Could not load your day', error: err.message });
  }
}

module.exports = { myDay };
