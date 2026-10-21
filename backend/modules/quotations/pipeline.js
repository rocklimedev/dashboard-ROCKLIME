// Quotation pipeline: one place for the status rules.
//
//   DRAFT ──share/send──▶ SENT ──▶ NEGOTIATION
//     │                    │            │
//     └────────────────────┴────────────┴──▶ WON      (automatic: an order exists for it)
//                                       └──▶ LOST     (by hand, reason required)
//                                       └──▶ EXPIRED  (automatic: past valid-till date)
//
// WON is never set by hand: it follows the orders. If every order made from a
// quotation is cancelled or deleted, the quotation goes back to NEGOTIATION.
// An EXPIRED quotation comes back to SENT/DRAFT when its valid-till date is
// moved into the future.
const { QueryTypes } = require('sequelize');

const STATUSES = ['DRAFT', 'SENT', 'NEGOTIATION', 'WON', 'LOST', 'EXPIRED'];
const OPEN = ['DRAFT', 'SENT', 'NEGOTIATION'];
const MANUAL = ['DRAFT', 'SENT', 'NEGOTIATION', 'LOST'];
const LOST_REASONS = [
  'Price too high',
  'Bought from another dealer',
  'Product not available in time',
  'Project cancelled or postponed',
  'Chose a different brand',
  'No response from customer',
  'Other',
];
const CHANNELS = ['CALL', 'WHATSAPP', 'VISIT', 'MEETING', 'EMAIL', 'OTHER'];

const m = () => require('../../models');
const bad = (msg, status = 400) => Object.assign(new Error(msg), { status });
const today = () => new Date().toISOString().slice(0, 10);

async function validityDays() {
  try {
    const s = await require('../settings/settings.service').getSetting('company');
    return Number(s.validityDays) || 15;
  } catch {
    return 15;
  }
}

/** Valid-till date (YYYY-MM-DD): due_date, else quotation date + validity days. */
function validTill(q, days = 15) {
  if (q.due_date) return String(q.due_date).slice(0, 10);
  const base = new Date(q.quotation_date || q.createdAt || Date.now());
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

async function write(
  quotation,
  status,
  { userId = null, lostReason = null, lostNote = null, req = null, note = null } = {},
) {
  const from = quotation.status;
  if (from === status && status !== 'LOST') return quotation;
  const patch = { status, statusChangedAt: new Date() };
  if (status === 'SENT' && !quotation.sentAt) patch.sentAt = new Date();
  if (status === 'LOST') {
    patch.lostReason = lostReason;
    patch.lostNote = lostNote || null;
    patch.nextFollowUp = null;
  } else {
    patch.lostReason = null;
    patch.lostNote = null;
  }
  if (['WON', 'EXPIRED'].includes(status)) patch.nextFollowUp = null;
  await quotation.update(patch);
  try {
    const logActivity = require('../../utils/activityLogger');
    {
      await logActivity({
        userId,
        contextTag: 'SALES',
        subContext: 'QUOTATION',
        action: 'QUOTATION_STATUS',
        entityId: quotation.quotationId,
        entityName: quotation.reference_number,
        description: `Quotation ${quotation.reference_number} ${from} → ${status}${note ? ` (${note})` : ''}${lostReason ? `: ${lostReason}` : ''}`,
        oldValues: { status: from },
        newValues: { status, lostReason },
        req,
      });
    }
  } catch {
    /* the activity log is best-effort */
  }
  return quotation;
}

/** Status change requested by a person (PATCH /quotation/:id/status). */
async function setStatus(quotationId, status, { userId, lostReason, lostNote, req } = {}) {
  status = String(status || '').toUpperCase();
  if (!MANUAL.includes(status)) {
    throw bad(
      status === 'WON'
        ? 'A quotation becomes Won when an order is made from it. Use Convert to order.'
        : status === 'EXPIRED'
          ? 'Quotations expire on their own after the valid-till date. To close one, mark it Lost.'
          : `Unknown status. Use one of: ${MANUAL.join(', ')}.`,
    );
  }
  const { Quotation } = m();
  const q = await Quotation.findByPk(quotationId);
  if (!q) throw bad('Quotation not found', 404);
  if (q.status === 'WON') {
    throw bad('This quotation has an order. Cancel the order first if the customer backed out.');
  }
  if (status === 'LOST' && !String(lostReason || '').trim())
    throw bad('Pick a reason why the quotation was lost.');
  if (status !== 'LOST' && ['EXPIRED', 'LOST'].includes(q.status)) {
    const days = await validityDays();
    if (validTill(q, days) < today()) {
      throw bad(
        'This quotation is past its valid-till date. Edit it and set a new valid-till date first.',
      );
    }
  }
  return write(q, status, {
    userId,
    lostReason: lostReason ? String(lostReason).slice(0, 120) : null,
    lostNote,
    req,
  });
}

/** Draft → Sent when it is shared or sent to the customer. */
async function markSent(quotationId, { userId = null } = {}) {
  const { Quotation } = m();
  const q = await Quotation.findByPk(quotationId);
  if (!q) return null;
  if (q.status === 'DRAFT') return write(q, 'SENT', { userId, note: 'shared with customer' });
  if (!q.sentAt) await q.update({ sentAt: new Date() });
  return q;
}

/** Won follows the orders: any live order → WON; none left → back to NEGOTIATION. */
async function syncWon(quotationId) {
  if (!quotationId) return;
  const { Quotation, sequelize } = m();
  const q = await Quotation.findByPk(quotationId);
  if (!q) return;
  const [{ n }] = await sequelize.query(
    "SELECT COUNT(*) AS n FROM orders WHERE quotationId = ? AND status <> 'CANCELED'",
    { replacements: [quotationId], type: QueryTypes.SELECT },
  );
  if (Number(n) > 0 && q.status !== 'WON') await write(q, 'WON', { note: 'order created' });
  else if (Number(n) === 0 && q.status === 'WON')
    await write(q, 'NEGOTIATION', { note: 'its orders were cancelled' });
}

/** After an edit: an expired quotation with a new future valid-till date reopens. */
async function reopenIfExtended(quotationId) {
  const { Quotation } = m();
  const q = await Quotation.findByPk(quotationId);
  if (!q || q.status !== 'EXPIRED') return;
  const days = await validityDays();
  if (validTill(q, days) >= today())
    await write(q, q.sentAt ? 'SENT' : 'DRAFT', { note: 'valid-till date extended' });
}

let lastExpiry = 0;
/** Marks open quotations past their valid-till date as EXPIRED. Cheap; throttled to once a minute. */
async function expireOverdue({ force = false } = {}) {
  if (!force && Date.now() - lastExpiry < 60 * 1000) return 0;
  lastExpiry = Date.now();
  const { sequelize } = m();
  const days = await validityDays();
  const [res] = await sequelize.query(
    `UPDATE quotations SET status = 'EXPIRED', statusChangedAt = NOW(), nextFollowUp = NULL
     WHERE status IN ('DRAFT','SENT','NEGOTIATION')
       AND COALESCE(due_date, DATE_ADD(DATE(quotation_date), INTERVAL :days DAY)) < CURDATE()`,
    { replacements: { days } },
  );
  return res?.affectedRows || 0;
}

/** Counts and value per status, plus follow-ups due, for the list header. */
async function summary({ createdBy = null } = {}) {
  await expireOverdue();
  const { sequelize } = m();
  const where = createdBy ? 'WHERE createdBy = :createdBy' : '';
  const rows = await sequelize.query(
    `SELECT status, COUNT(*) AS n, COALESCE(SUM(finalAmount),0) AS value FROM quotations ${where} GROUP BY status`,
    { replacements: { createdBy }, type: QueryTypes.SELECT },
  );
  const by = Object.fromEntries(STATUSES.map((s) => [s, { count: 0, value: 0 }]));
  for (const r of rows) {
    const k = STATUSES.includes(r.status) ? r.status : 'DRAFT';
    by[k].count += Number(r.n);
    by[k].value += Number(r.value);
  }
  const [{ due }] = await sequelize.query(
    `SELECT COUNT(*) AS due FROM quotations
     WHERE status IN ('DRAFT','SENT','NEGOTIATION') AND nextFollowUp IS NOT NULL AND nextFollowUp <= CURDATE()
     ${createdBy ? 'AND createdBy = :createdBy' : ''}`,
    { replacements: { createdBy }, type: QueryTypes.SELECT },
  );
  const closed = by.WON.count + by.LOST.count + by.EXPIRED.count;
  return {
    byStatus: by,
    open: {
      count: OPEN.reduce((a, s) => a + by[s].count, 0),
      value: OPEN.reduce((a, s) => a + by[s].value, 0),
    },
    followUpsDue: Number(due),
    winRate: closed ? Math.round((by.WON.count / closed) * 100) : null,
  };
}

/** Log a follow-up and set the next date. A Draft becomes Sent (the customer has it). */
async function addFollowUp(quotationId, { channel = 'CALL', note, nextDate = null, userId }) {
  const { Quotation, QuotationFollowUp } = m();
  const q = await Quotation.findByPk(quotationId);
  if (!q) throw bad('Quotation not found', 404);
  if (!String(note || '').trim()) throw bad('Write what happened on the follow-up.');
  channel = String(channel || 'CALL').toUpperCase();
  if (!CHANNELS.includes(channel)) channel = 'OTHER';
  if (nextDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(nextDate).slice(0, 10)))
    throw bad('Next follow-up date is not a valid date.');
  if (nextDate && String(nextDate).slice(0, 10) < today())
    throw bad("Next follow-up date can't be in the past.");
  const f = await QuotationFollowUp.create({
    quotationId,
    userId,
    channel,
    note: String(note).trim(),
    nextDate: nextDate ? String(nextDate).slice(0, 10) : null,
  });
  const patch = { nextFollowUp: OPEN.includes(q.status) ? f.nextDate : null };
  await q.update(patch);
  if (q.status === 'DRAFT') await write(q, 'SENT', { userId, note: 'followed up' });
  return f;
}

async function listFollowUps(quotationId) {
  const { QuotationFollowUp, User } = m();
  const rows = await QuotationFollowUp.findAll({
    where: { quotationId },
    order: [['createdAt', 'DESC']],
    raw: true,
  });
  const ids = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
  const users = ids.length
    ? await User.findAll({
        where: { userId: ids },
        attributes: ['userId', 'name', 'username'],
        raw: true,
      })
    : [];
  const name = Object.fromEntries(users.map((u) => [u.userId, u.name || u.username]));
  return rows.map((r) => ({ ...r, userName: name[r.userId] || null }));
}

module.exports = {
  STATUSES,
  OPEN,
  MANUAL,
  LOST_REASONS,
  CHANNELS,
  validTill,
  validityDays,
  setStatus,
  markSent,
  syncWon,
  reopenIfExtended,
  expireOverdue,
  summary,
  addFollowUp,
  listFollowUps,
};
