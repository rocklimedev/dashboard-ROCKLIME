// CRM: the sales pipeline before a quotation is won — enquiries, follow-ups,
// showroom/site visits — run on CM ERP's own data, like INOS, and mirrored to
// Zoho Bigin when the company has connected it.
//
// Connected to the rest of the ERP:
//   deal → customer   "Make customer" creates or finds the customer (by mobile)
//   deal → quotation  "Make quotation" opens the cart for that customer; the new
//                     quotation is linked to the deal and its total becomes the
//                     deal value
//   quotation → deal  the deal follows its quotation: Sent → Quotation sent,
//                     Negotiation → Negotiation, an order or Won → Won, Lost → Lost
//
// Bigin: every create / change / stage move is pushed to Bigin's Pipelines
// module in the background (a failure is noted on the deal, never blocks the
// user). "Sync with Bigin" (and every 15 minutes while connected) pulls deals
// that changed in Bigin.
const { randomUUID } = require("crypto");
const { QueryTypes } = require("sequelize");
const bigin = require("./bigin");
const { getSetting } = require("../settings/settings.service");

const STAGES = [
  { id: "capture", label: "New enquiry", short: "Enquiry", color: "#8c8c8c" },
  { id: "qual", label: "Qualified", short: "Qualified", color: "#1677ff" },
  { id: "visit", label: "Showroom / site visit", short: "Visit", color: "#722ed1" },
  { id: "quote", label: "Quotation sent", short: "Quoted", color: "#fa8c16" },
  { id: "nego", label: "Negotiation", short: "Negotiation", color: "#d4b106" },
  { id: "won", label: "Won", short: "Won", color: "#389e0d", won: true },
  { id: "nurture", label: "Nurture later", short: "Nurture", color: "#8c8c8c", closed: true },
  { id: "lost", label: "Lost", short: "Lost", color: "#cf1322", closed: true },
];
const STAGE_IDS = STAGES.map((s) => s.id);
const OPEN = ["capture", "qual", "visit", "quote", "nego"];
const ORDER = Object.fromEntries(STAGES.map((s, i) => [s.id, i]));
const TAGS = ["Hot", "Warm", "Cold", "VIP"];
const CUSTOMER_TYPES = ["Retail", "Architect", "Interior", "Builder", "Contractor"];
const LOST_REASONS = ["Price too high", "Bought elsewhere", "Project on hold", "No response", "Product not available", "Delivery time", "Other"];
const DAY = 86400000;

const db = () => require("../../models").sequelize;
const models = () => require("../../models");
const q = (sql, r = {}) => db().query(sql, { replacements: r, type: QueryTypes.SELECT });
const run = (sql, r = {}) => db().query(sql, { replacements: r });
const bad = (m, status = 400) => Object.assign(new Error(m), { status });
const clean = (v, n = 200) => (v == null || String(v).trim() === "" ? null : String(v).trim().slice(0, n));
const money = (v) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const mobile = (v) => {
  const d = String(v || "").replace(/\D/g, "");
  if (!d) return null;
  const ten = d.length > 10 ? d.slice(-10) : d;
  if (ten.length !== 10) throw bad("Mobile number should have 10 digits");
  return ten;
};
const day = (v) => (v ? String(v).slice(0, 10) : null);

// ---------------------------------------------------------------- helpers

async function log(dealId, kind, text, userId) {
  await run("INSERT INTO crm_activities (id, dealId, kind, text, userId, createdAt) VALUES (:id, :dealId, :kind, :text, :userId, NOW())", {
    id: randomUUID(),
    dealId,
    kind,
    text: String(text).slice(0, 5000),
    userId: userId || null,
  });
}

async function findDeal(id) {
  const [d] = await q("SELECT * FROM crm_deals WHERE id = :id", { id });
  if (!d) throw bad("Deal not found", 404);
  return d;
}

const stageLabel = (id) => STAGES.find((s) => s.id === id)?.label || id;

function toCard(d, extra = {}) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(d.stageEnteredAt || d.createdAt).getTime()) / DAY));
  return {
    id: d.id,
    title: d.title,
    contactName: d.contactName,
    phone: d.phone,
    email: d.email,
    company: d.company,
    customerType: d.customerType,
    city: d.city,
    source: d.source,
    stage: d.stage,
    amount: d.amount == null ? null : Number(d.amount),
    expectedClose: d.expectedClose,
    ownerId: d.ownerId,
    ownerName: d.ownerName || null,
    tag: d.tag,
    lostReason: d.lostReason,
    description: d.description,
    customerId: d.customerId,
    customerName: d.customerName || null,
    quotationId: d.quotationId,
    quotationRef: d.quotationRef || null,
    orderId: d.orderId,
    orderNo: d.orderNo || null,
    biginId: d.biginId,
    biginSyncedAt: d.biginSyncedAt,
    biginError: d.biginError,
    daysInStage: days,
    stageEnteredAt: d.stageEnteredAt,
    closedAt: d.closedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    nextTask: d.nextTaskTitle ? { title: d.nextTaskTitle, dueDate: d.nextTaskDue } : null,
    openTasks: Number(d.openTasks || 0),
    ...extra,
  };
}

const SELECT = `
  SELECT d.*, u.name AS ownerName, c.name AS customerName, qt.reference_number AS quotationRef, o.orderNo,
    (SELECT COUNT(*) FROM crm_tasks t WHERE t.dealId = d.id AND t.done = 0) AS openTasks,
    (SELECT t.title FROM crm_tasks t WHERE t.dealId = d.id AND t.done = 0 ORDER BY t.dueDate IS NULL, t.dueDate LIMIT 1) AS nextTaskTitle,
    (SELECT t.dueDate FROM crm_tasks t WHERE t.dealId = d.id AND t.done = 0 ORDER BY t.dueDate IS NULL, t.dueDate LIMIT 1) AS nextTaskDue
  FROM crm_deals d
  LEFT JOIN users u ON u.userId = d.ownerId
  LEFT JOIN customers c ON c.customerId = d.customerId
  LEFT JOIN quotations qt ON qt.quotationId = d.quotationId
  LEFT JOIN orders o ON o.id = d.orderId`;

function filters(f = {}) {
  const where = [];
  const r = {};
  if (f.q) {
    where.push("(d.title LIKE :q OR d.contactName LIKE :q OR d.phone LIKE :q OR d.company LIKE :q OR d.email LIKE :q OR d.city LIKE :q)");
    r.q = `%${String(f.q).trim()}%`;
  }
  if (f.owner === "me" && f.userId) {
    where.push("d.ownerId = :me");
    r.me = f.userId;
  } else if (f.owner) {
    where.push("d.ownerId = :owner");
    r.owner = f.owner;
  }
  if (f.source) {
    where.push("d.source = :source");
    r.source = f.source;
  }
  if (f.tag) {
    where.push("d.tag = :tag");
    r.tag = f.tag;
  }
  if (f.customerType) {
    where.push("d.customerType = :ctype");
    r.ctype = f.customerType;
  }
  if (f.stage) {
    const list = String(f.stage).split(",").filter((s) => STAGE_IDS.includes(s));
    if (list.length) {
      where.push("d.stage IN (:stages)");
      r.stages = list;
    }
  }
  if (f.customerId) {
    where.push("d.customerId = :cid");
    r.cid = f.customerId;
  }
  if (f.from) {
    where.push("d.createdAt >= :from");
    r.from = day(f.from);
  }
  if (f.to) {
    where.push("d.createdAt < DATE_ADD(:to, INTERVAL 1 DAY)");
    r.to = day(f.to);
  }
  if (f.closing === "month") where.push("d.expectedClose BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())");
  if (f.closing === "late") where.push(`d.expectedClose < CURDATE() AND d.stage IN ('${OPEN.join("','")}')`);
  if (f.followUp === "due")
    where.push("EXISTS (SELECT 1 FROM crm_tasks t WHERE t.dealId = d.id AND t.done = 0 AND t.dueDate <= CURDATE())");
  if (f.bigin === "error") where.push("d.biginError IS NOT NULL");
  if (f.bigin === "linked") where.push("d.biginId IS NOT NULL");
  if (f.bigin === "local") where.push("d.biginId IS NULL");
  if (f.minValue) {
    where.push("d.amount >= :minV");
    r.minV = money(f.minValue) || 0;
  }
  if (f.maxValue) {
    where.push("d.amount <= :maxV");
    r.maxV = money(f.maxValue) || 0;
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", r };
}

const SORTS = {
  updated: "d.updatedAt DESC",
  newest: "d.createdAt DESC",
  oldest: "d.createdAt ASC",
  "value-desc": "d.amount IS NULL, d.amount DESC",
  "value-asc": "d.amount IS NULL, d.amount ASC",
  close: "d.expectedClose IS NULL, d.expectedClose ASC",
  stuck: "d.stageEnteredAt ASC",
  name: "d.title ASC",
};

// ---------------------------------------------------------------- quotation ↔ deal

/**
 * Deals follow the quotations and orders linked to them. Runs before the board
 * loads (cheap: only open deals that have a quotation) and after linking.
 */
async function followLinkedDocuments(onlyId) {
  const rows = await q(
    `SELECT d.id, d.stage, d.quotationId, qt.status AS qStatus, qt.finalAmount, qt.lostReason AS qLost,
       (SELECT o.id FROM orders o WHERE o.quotationId = d.quotationId AND o.status <> 'CANCELED' ORDER BY o.createdAt LIMIT 1) AS orderId
     FROM crm_deals d JOIN quotations qt ON qt.quotationId = d.quotationId
     WHERE d.stage IN (:open) ${onlyId ? "AND d.id = :id" : ""}`,
    { open: [...OPEN, "nurture"], id: onlyId },
  );
  const moved = [];
  for (const r of rows) {
    let to = null;
    let why = "";
    if (r.orderId || r.qStatus === "WON") {
      to = "won";
      why = r.orderId ? "Order created from the quotation" : "Quotation marked won";
    } else if (r.qStatus === "LOST") {
      to = "lost";
      why = `Quotation lost${r.qLost ? `: ${r.qLost}` : ""}`;
    } else if (r.qStatus === "NEGOTIATION" && ORDER[r.stage] < ORDER.nego) {
      to = "nego";
      why = "Quotation in negotiation";
    } else if (["SENT", "DRAFT"].includes(r.qStatus) && ORDER[r.stage] < ORDER.quote) {
      to = "quote";
      why = r.qStatus === "SENT" ? "Quotation sent" : "Quotation made";
    }
    const patch = { amount: r.finalAmount != null ? Number(r.finalAmount) : null, orderId: r.orderId || null };
    await run("UPDATE crm_deals SET amount = COALESCE(:amount, amount), orderId = COALESCE(:orderId, orderId) WHERE id = :id", { ...patch, id: r.id });
    if (to && to !== r.stage) {
      await setStage(r.id, to, { reason: to === "lost" ? r.qLost || "Quotation lost" : null, note: why, auto: true });
      moved.push({ id: r.id, to });
    }
  }
  return moved;
}

// ---------------------------------------------------------------- read

async function meta() {
  const crm = await getSetting("crm");
  const owners = await q(
    "SELECT userId AS id, name FROM users WHERE status = 'active' OR status IS NULL ORDER BY name",
  ).catch(() => q("SELECT userId AS id, name FROM users ORDER BY name"));
  return {
    stages: STAGES,
    sources: crm.sources,
    tags: TAGS,
    customerTypes: CUSTOMER_TYPES,
    lostReasons: LOST_REASONS,
    owners,
    stuckAfterDays: crm.stuckAfterDays,
  };
}

async function board(f = {}) {
  await followLinkedDocuments().catch(() => {});
  const crm = await getSetting("crm");
  const { sql, r } = filters(f);
  const rows = await q(`${SELECT} ${sql} ORDER BY ${SORTS[f.sort] || SORTS.updated} LIMIT 2000`, r);
  const columns = Object.fromEntries(STAGES.map((s) => [s.id, []]));
  const totals = Object.fromEntries(STAGES.map((s) => [s.id, { count: 0, amount: 0 }]));
  for (const d of rows) {
    const card = toCard(d);
    card.stuck = OPEN.includes(card.stage) && card.daysInStage >= (crm.stuckAfterDays || 10);
    (columns[card.stage] || columns.capture).push(card);
    const t = totals[card.stage] || totals.capture;
    t.count += 1;
    t.amount += card.amount || 0;
  }
  const open = OPEN.reduce((a, s) => ({ count: a.count + totals[s].count, amount: a.amount + totals[s].amount }), { count: 0, amount: 0 });
  const [month] = await q(
    `SELECT COUNT(*) AS won, COALESCE(SUM(amount),0) AS wonAmount,
       (SELECT COUNT(*) FROM crm_deals WHERE stage = 'lost' AND closedAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS lost,
       (SELECT COUNT(*) FROM crm_deals WHERE createdAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS newDeals
     FROM crm_deals WHERE stage = 'won' AND closedAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
  );
  const [due] = await q("SELECT COUNT(*) AS n FROM crm_tasks WHERE done = 0 AND dueDate <= CURDATE()");
  return {
    stages: STAGES,
    columns,
    totals,
    summary: {
      open,
      wonThisMonth: { count: Number(month.won), amount: Number(month.wonAmount) },
      lostThisMonth: Number(month.lost),
      newThisMonth: Number(month.newDeals),
      followUpsDue: Number(due.n),
    },
    bigin: await bigin.status(),
  };
}

async function list(f = {}) {
  const { sql, r } = filters(f);
  const page = Math.max(1, Number(f.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(f.limit) || 50));
  const [{ n }] = await q(`SELECT COUNT(*) AS n FROM crm_deals d ${sql}`, r);
  const rows = await q(`${SELECT} ${sql} ORDER BY ${SORTS[f.sort] || SORTS.updated} LIMIT ${limit} OFFSET ${(page - 1) * limit}`, r);
  return { data: rows.map((d) => toCard(d)), total: Number(n), page, limit };
}

async function getDeal(id) {
  await followLinkedDocuments(id).catch(() => {});
  const [d] = await q(`${SELECT} WHERE d.id = :id`, { id });
  if (!d) throw bad("Deal not found", 404);
  const activity = await q(
    "SELECT a.id, a.kind, a.text, a.createdAt, u.name AS userName FROM crm_activities a LEFT JOIN users u ON u.userId = a.userId WHERE a.dealId = :id ORDER BY a.createdAt DESC LIMIT 200",
    { id },
  );
  const tasks = await q(
    "SELECT t.id, t.title, t.dueDate, t.done, t.assignedTo, u.name AS assignedName FROM crm_tasks t LEFT JOIN users u ON u.userId = t.assignedTo WHERE t.dealId = :id ORDER BY t.done, t.dueDate IS NULL, t.dueDate",
    { id },
  );
  let quotations = [];
  let orders = [];
  if (d.customerId) {
    quotations = await q(
      "SELECT quotationId, reference_number AS ref, document_title AS title, finalAmount, status, createdAt FROM quotations WHERE customerId = :c ORDER BY createdAt DESC LIMIT 20",
      { c: d.customerId },
    );
    orders = await q("SELECT id, orderNo, status, finalAmount, quotationId, createdAt FROM orders WHERE createdFor = :c ORDER BY createdAt DESC LIMIT 20", { c: d.customerId });
  }
  const others = d.phone
    ? await q("SELECT id, title, stage, amount, createdAt FROM crm_deals WHERE phone = :p AND id <> :id ORDER BY createdAt DESC LIMIT 10", { p: d.phone, id })
    : [];
  return { deal: toCard(d), activity, tasks: tasks.map((t) => ({ ...t, done: !!t.done })), quotations, orders, otherDeals: others };
}

// ---------------------------------------------------------------- write

const FIELDS = ["title", "contactName", "phone", "email", "company", "customerType", "city", "source", "amount", "expectedClose", "ownerId", "tag", "description"];

function readFields(body, { partial = false } = {}) {
  const v = {};
  const has = (k) => body[k] !== undefined;
  if (!partial || has("title")) v.title = clean(body.title, 200);
  if (!partial || has("contactName")) v.contactName = clean(body.contactName, 150);
  if (!partial || has("phone")) v.phone = mobile(body.phone);
  if (!partial || has("email")) {
    v.email = clean(body.email, 150);
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) throw bad("Email address is not valid");
  }
  if (!partial || has("company")) v.company = clean(body.company, 150);
  if (!partial || has("customerType")) {
    v.customerType = clean(body.customerType, 30);
    if (v.customerType && !CUSTOMER_TYPES.includes(v.customerType)) throw bad("Unknown customer type");
  }
  if (!partial || has("city")) v.city = clean(body.city, 80);
  if (!partial || has("source")) v.source = clean(body.source, 60);
  if (!partial || has("amount")) v.amount = money(body.amount);
  if (!partial || has("expectedClose")) v.expectedClose = day(body.expectedClose);
  if (!partial || has("ownerId")) v.ownerId = clean(body.ownerId, 36);
  if (!partial || has("tag")) {
    v.tag = clean(body.tag, 20);
    if (v.tag && !TAGS.includes(v.tag)) throw bad("Unknown tag");
  }
  if (!partial || has("description")) v.description = clean(body.description, 5000);
  for (const k of Object.keys(v)) if (!FIELDS.includes(k)) delete v[k];
  return v;
}

async function createDeal(body, user) {
  const v = readFields(body);
  if (!v.contactName && !v.title) throw bad("Give the deal a name or the customer's name");
  if (!v.phone && !v.email && !body.customerId) throw bad("Add a mobile number or an email so the customer can be reached");
  const stage = STAGE_IDS.includes(body.stage) ? body.stage : "capture";
  if (!v.title) v.title = `${v.contactName}${v.city ? ` · ${v.city}` : ""}`;
  if (!v.ownerId) v.ownerId = user?.userId || null;

  // started from a customer: copy their details
  let customerId = clean(body.customerId, 36);
  if (customerId) {
    const [c] = await q("SELECT customerId, name, mobileNumber, email, companyName, customerType FROM customers WHERE customerId = :id", { id: customerId });
    if (!c) throw bad("Customer not found", 404);
    v.contactName = v.contactName || c.name;
    v.phone = v.phone || mobile(c.mobileNumber) || null;
    v.email = v.email || c.email;
    v.company = v.company || c.companyName;
    v.customerType = v.customerType || c.customerType;
  } else if (v.phone) {
    // an existing customer with the same mobile is linked straight away
    const [c] = await q("SELECT customerId FROM customers WHERE RIGHT(REPLACE(mobileNumber,' ',''),10) = :p LIMIT 1", { p: v.phone });
    if (c) customerId = c.customerId;
  }

  const id = randomUUID();
  await run(
    `INSERT INTO crm_deals (id, ${FIELDS.join(", ")}, stage, customerId, createdBy, stageEnteredAt, closedAt, createdAt, updatedAt)
     VALUES (:id, ${FIELDS.map((f) => `:${f}`).join(", ")}, :stage, :customerId, :createdBy, NOW(), :closedAt, NOW(), NOW())`,
    { id, ...v, stage, customerId: customerId || null, createdBy: user?.userId || null, closedAt: ["won", "lost"].includes(stage) ? new Date() : null },
  );
  await log(id, "system", `Deal created${v.source ? ` (source: ${v.source})` : ""}${customerId ? " and linked to the customer" : ""}`, user?.userId);
  if (body.note) await log(id, "note", clean(body.note, 5000), user?.userId);
  if (body.followUp) await addTask(id, { title: body.followUpTitle || "Follow up", dueDate: body.followUp }, user);
  pushToBigin(id);
  return (await getDeal(id)).deal;
}

async function updateDeal(id, body, user) {
  const before = await findDeal(id);
  const v = readFields(body, { partial: true });
  if ("title" in v && !v.title) throw bad("The deal needs a name");
  const keys = Object.keys(v);
  if (keys.length) {
    await run(`UPDATE crm_deals SET ${keys.map((k) => `${k} = :${k}`).join(", ")}, updatedAt = NOW() WHERE id = :id`, { ...v, id });
    const changed = keys.filter((k) => String(before[k] ?? "") !== String(v[k] ?? ""));
    if (changed.length) await log(id, "update", `Changed ${changed.join(", ")}`, user?.userId);
  }
  if (body.stage && body.stage !== before.stage) await setStage(id, body.stage, { reason: body.lostReason, userId: user?.userId });
  else pushToBigin(id);
  return (await getDeal(id)).deal;
}

async function setStage(id, stage, { reason, note, userId, auto = false } = {}) {
  if (!STAGE_IDS.includes(stage)) throw bad("Unknown stage");
  const d = await findDeal(id);
  if (d.stage === stage) return d;
  if (stage === "lost" && !clean(reason)) throw bad("Pick a reason why the deal was lost");
  await run(
    `UPDATE crm_deals SET stage = :stage, stageEnteredAt = NOW(), updatedAt = NOW(),
       closedAt = :closedAt, lostReason = :lostReason WHERE id = :id`,
    { id, stage, closedAt: ["won", "lost"].includes(stage) ? new Date() : null, lostReason: stage === "lost" ? clean(reason, 300) : null },
  );
  await log(id, "stage", `${stageLabel(d.stage)} → ${stageLabel(stage)}${stage === "lost" ? ` (${clean(reason, 300)})` : ""}${note ? ` · ${note}` : ""}${auto ? " · automatic" : ""}`, userId);
  pushToBigin(id);
  return findDeal(id);
}

async function deleteDeal(id, user) {
  const d = await findDeal(id);
  await run("DELETE FROM crm_tasks WHERE dealId = :id", { id });
  await run("DELETE FROM crm_activities WHERE dealId = :id", { id });
  await run("DELETE FROM crm_deals WHERE id = :id", { id });
  // deleting here also deletes the Bigin deal (as INOS does)
  if (d.biginId) bigin.deletePipeline(d.biginId).catch(() => {});
  return { id, by: user?.userId || null };
}

async function addNote(id, text, user, kind = "note") {
  await findDeal(id);
  const t = clean(text, 5000);
  if (!t) throw bad("Write something first");
  const k = ["note", "call", "visit", "whatsapp", "email"].includes(kind) ? kind : "note";
  await log(id, k, t, user?.userId);
  await run("UPDATE crm_deals SET updatedAt = NOW() WHERE id = :id", { id });
  return { ok: true };
}

async function addTask(id, body, user) {
  await findDeal(id);
  const title = clean(body.title, 200);
  if (!title) throw bad("What needs doing?");
  const tid = randomUUID();
  await run(
    "INSERT INTO crm_tasks (id, dealId, title, dueDate, done, assignedTo, createdBy, createdAt, updatedAt) VALUES (:tid, :id, :title, :due, 0, :to, :by, NOW(), NOW())",
    { tid, id, title, due: day(body.dueDate), to: clean(body.assignedTo, 36) || user?.userId || null, by: user?.userId || null },
  );
  await log(id, "task", `Follow-up: ${title}${body.dueDate ? ` (due ${day(body.dueDate)})` : ""}`, user?.userId);
  return { id: tid };
}

async function updateTask(taskId, body, user) {
  const [t] = await q("SELECT * FROM crm_tasks WHERE id = :taskId", { taskId });
  if (!t) throw bad("Follow-up not found", 404);
  const patch = {};
  if (body.title !== undefined) patch.title = clean(body.title, 200) || t.title;
  if (body.dueDate !== undefined) patch.dueDate = day(body.dueDate);
  if (body.done !== undefined) patch.done = body.done ? 1 : 0;
  if (body.assignedTo !== undefined) patch.assignedTo = clean(body.assignedTo, 36);
  const keys = Object.keys(patch);
  if (keys.length) await run(`UPDATE crm_tasks SET ${keys.map((k) => `${k} = :${k}`).join(", ")}, updatedAt = NOW() WHERE id = :taskId`, { ...patch, taskId });
  if (body.done && !t.done) await log(t.dealId, "task", `Done: ${t.title}${body.outcome ? ` — ${clean(body.outcome, 1000)}` : ""}`, user?.userId);
  return { ok: true };
}

async function deleteTask(taskId) {
  await run("DELETE FROM crm_tasks WHERE id = :taskId", { taskId });
  return { ok: true };
}

/** Follow-ups for the "My follow-ups" page (and My day). */
async function tasks({ userId, scope = "mine", when = "due" } = {}) {
  const where = ["t.done = 0"];
  const r = {};
  if (scope === "mine") {
    where.push("(t.assignedTo = :me OR (t.assignedTo IS NULL AND d.ownerId = :me))");
    r.me = userId;
  }
  if (when === "due") where.push("t.dueDate <= CURDATE()");
  if (when === "week") where.push("t.dueDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
  const rows = await q(
    `SELECT t.id, t.title, t.dueDate, t.dealId, d.title AS dealTitle, d.contactName, d.phone, d.stage, d.amount, u.name AS assignedName
     FROM crm_tasks t JOIN crm_deals d ON d.id = t.dealId LEFT JOIN users u ON u.userId = t.assignedTo
     WHERE ${where.join(" AND ")} ORDER BY t.dueDate IS NULL, t.dueDate, t.createdAt LIMIT 300`,
    r,
  );
  return rows.map((x) => ({ ...x, amount: x.amount == null ? null : Number(x.amount) }));
}

// ---------------------------------------------------------------- ERP links

/** Find (by mobile/email) or create the customer for a deal. */
async function ensureCustomer(id, user) {
  const d = await findDeal(id);
  if (d.customerId) {
    const [c] = await q("SELECT customerId FROM customers WHERE customerId = :c", { c: d.customerId });
    if (c) return { customerId: d.customerId, created: false };
  }
  let found = null;
  if (d.phone) [found] = await q("SELECT customerId FROM customers WHERE RIGHT(REPLACE(mobileNumber,' ',''),10) = :p LIMIT 1", { p: d.phone });
  if (!found && d.email) [found] = await q("SELECT customerId FROM customers WHERE email = :e LIMIT 1", { e: d.email });
  let customerId = found?.customerId;
  let created = false;
  if (!customerId) {
    const { Customer } = models();
    const c = await Customer.create({
      name: d.contactName || d.title,
      mobileNumber: d.phone || null,
      email: d.email || null,
      companyName: d.company || null,
      customerType: CUSTOMER_TYPES.includes(d.customerType) ? d.customerType : "Retail",
      notes: `From CRM deal "${d.title}"${d.source ? ` · source ${d.source}` : ""}${d.city ? ` · ${d.city}` : ""}`,
    });
    customerId = c.customerId;
    created = true;
  }
  await run("UPDATE crm_deals SET customerId = :c, updatedAt = NOW() WHERE id = :id", { c: customerId, id });
  await log(id, "system", created ? "Customer created from this deal" : "Linked to the existing customer", user?.userId);
  return { customerId, created };
}

async function linkQuotation(id, quotationId, user) {
  const d = await findDeal(id);
  const [qt] = await q("SELECT quotationId, customerId, reference_number AS ref, finalAmount FROM quotations WHERE quotationId = :qid", { qid: quotationId });
  if (!qt) throw bad("Quotation not found", 404);
  if (d.customerId && qt.customerId && d.customerId !== qt.customerId) throw bad("That quotation is for a different customer");
  await run("UPDATE crm_deals SET quotationId = :qid, customerId = COALESCE(customerId, :cid), amount = COALESCE(:amt, amount), updatedAt = NOW() WHERE id = :id", {
    qid: quotationId,
    cid: qt.customerId,
    amt: qt.finalAmount != null ? Number(qt.finalAmount) : null,
    id,
  });
  await log(id, "system", `Quotation ${qt.ref || ""} linked`.replace("  ", " "), user?.userId);
  await followLinkedDocuments(id);
  pushToBigin(id);
  return (await getDeal(id)).deal;
}

/** Deals of one customer (Customer 360 shows them). */
const forCustomer = (customerId) => list({ customerId, limit: 50, sort: "newest" });

// ---------------------------------------------------------------- Bigin mirror

async function biginRecord(d) {
  const crm = await getSetting("crm");
  const rec = {
    Deal_Name: d.title,
    Sub_Pipeline: crm.biginSubPipeline || "Sales Pipeline",
    Stage: crm.stageMap?.[d.stage] || "Qualification",
  };
  if (d.amount != null) rec.Amount = Number(d.amount);
  if (d.expectedClose) rec.Closing_Date = String(d.expectedClose).slice(0, 10);
  const desc = [d.description, d.source ? `Source: ${d.source}` : null, d.city ? `City: ${d.city}` : null, d.lostReason ? `Lost: ${d.lostReason}` : null]
    .filter(Boolean)
    .join("\n");
  if (desc) rec.Description = desc;
  return rec;
}

/** Send one deal to Bigin in the background. Never throws. */
function pushToBigin(id) {
  setImmediate(() => pushNow(id).catch(() => {}));
}

// one push at a time per deal, so a create is never sent twice
const locks = new Map();
async function pushNow(id) {
  const prev = locks.get(id) || Promise.resolve();
  const p = prev.catch(() => {}).then(() => pushOnce(id));
  locks.set(id, p);
  try {
    return await p;
  } finally {
    if (locks.get(id) === p) locks.delete(id);
  }
}

async function pushOnce(id) {
  if (!(await bigin.connection())) return { skipped: true };
  const d = await findDeal(id);
  try {
    const rec = await biginRecord(d);
    if (!d.biginId && (d.contactName || d.phone || d.email)) {
      const contactId = await bigin.upsertContact({ name: d.contactName || d.title, phone: d.phone, email: d.email, company: d.company });
      if (contactId) rec.Contact_Name = { id: contactId };
    }
    const biginId = await bigin.writePipeline(d.biginId, rec);
    await run("UPDATE crm_deals SET biginId = :b, biginSyncedAt = NOW(), biginError = NULL WHERE id = :id", { b: biginId, id });
    return { biginId };
  } catch (err) {
    // a deal deleted in Bigin: send it again as a new one next time
    if (d.biginId && /INVALID_DATA|not found|record not exist/i.test(`${err.zohoCode} ${err.message}`)) {
      await run("UPDATE crm_deals SET biginId = NULL WHERE id = :id", { id });
    }
    await run("UPDATE crm_deals SET biginError = :e WHERE id = :id", { e: String(err.message).slice(0, 290), id });
    throw err;
  }
}

/** Pull deals from Bigin (new and changed) and push local deals Bigin has not got yet. */
async function syncWithBigin({ userId, full = false } = {}) {
  const conn = await bigin.connection();
  if (!conn) throw bad("Zoho Bigin is not connected. Connect it in CRM → Bigin connection.");
  const crm = await getSetting("crm");
  const reverse = {};
  // when two CM stages share a Bigin stage, the main one wins (Qualification → Qualified, not Enquiry/Nurture)
  const entries = Object.entries(crm.stageMap || {}).sort(([a], [b]) => (["capture", "nurture"].includes(a) ? 1 : 0) - (["capture", "nurture"].includes(b) ? 1 : 0));
  for (const [local, remote] of entries) {
    if (remote && !reverse[remote.toLowerCase()]) reverse[remote.toLowerCase()] = local;
  }
  reverse["closed won"] = "won";
  reverse["closed lost"] = "lost";

  const since = !full && conn.lastSyncAt ? new Date(new Date(conn.lastSyncAt).getTime() - 10 * 60000) : null;
  const rows = await bigin.listPipelines({ modifiedSince: since });
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const contactCache = new Map();
  for (const r of rows) {
    const stage = reverse[String(r.Stage || "").toLowerCase()] || "qual";
    const [existing] = await q("SELECT * FROM crm_deals WHERE biginId = :b", { b: String(r.id) });
    const values = {
      title: clean(r.Deal_Name, 200) || "Bigin deal",
      amount: money(r.Amount),
      expectedClose: day(r.Closing_Date),
    };
    if (existing) {
      // a stage moved further on in CM ERP (Won through an order) is not taken back by an older Bigin stage
      const keepLocal = ORDER[existing.stage] > ORDER[stage] && ["won", "lost"].includes(existing.stage);
      const changed = values.title !== existing.title || String(values.amount ?? "") !== String(existing.amount == null ? "" : Number(existing.amount)) || (values.expectedClose || null) !== (day(existing.expectedClose) || null) || (!keepLocal && stage !== existing.stage);
      if (!changed) {
        unchanged += 1;
        continue;
      }
      await run("UPDATE crm_deals SET title = :title, amount = :amount, expectedClose = :expectedClose, biginSyncedAt = NOW(), biginError = NULL, updatedAt = NOW() WHERE id = :id", { ...values, id: existing.id });
      if (!keepLocal && stage !== existing.stage) {
        await run("UPDATE crm_deals SET stage = :stage, stageEnteredAt = NOW(), closedAt = :closedAt WHERE id = :id", {
          stage,
          closedAt: ["won", "lost"].includes(stage) ? new Date() : null,
          id: existing.id,
        });
        await log(existing.id, "bigin", `Stage changed in Bigin: ${stageLabel(existing.stage)} → ${stageLabel(stage)}`, null);
      } else {
        await log(existing.id, "bigin", "Updated from Bigin", null);
      }
      updated += 1;
    } else {
      let contact = null;
      const cid = r.Contact_Name?.id;
      if (cid) {
        if (!contactCache.has(cid)) contactCache.set(cid, await bigin.getContact(cid).catch(() => null));
        contact = contactCache.get(cid);
      }
      let phone = null;
      try {
        phone = mobile(contact?.Mobile || contact?.Phone);
      } catch {
        phone = null;
      }
      const name = contact ? [contact.First_Name, contact.Last_Name].filter(Boolean).join(" ") : r.Contact_Name?.name || null;
      const id = randomUUID();
      const [cust] = phone ? await q("SELECT customerId FROM customers WHERE RIGHT(REPLACE(mobileNumber,' ',''),10) = :p LIMIT 1", { p: phone }) : [];
      await run(
        `INSERT INTO crm_deals (id, title, contactName, phone, email, company, source, stage, amount, expectedClose, description, customerId, ownerId, biginId, biginSyncedAt, stageEnteredAt, closedAt, createdBy, createdAt, updatedAt)
         VALUES (:id, :title, :contactName, :phone, :email, :company, 'Zoho Bigin', :stage, :amount, :expectedClose, :description, :customerId, :ownerId, :biginId, NOW(), NOW(), :closedAt, :createdBy, :createdAt, NOW())`,
        {
          id,
          ...values,
          contactName: clean(name, 150),
          phone,
          email: clean(contact?.Email, 150),
          company: clean(r.Account_Name?.name || contact?.Account_Name?.name, 150),
          stage,
          description: clean(r.Description, 5000),
          customerId: cust?.customerId || null,
          ownerId: userId || null,
          biginId: String(r.id),
          closedAt: ["won", "lost"].includes(stage) ? new Date() : null,
          createdBy: userId || null,
          createdAt: r.Created_Time ? new Date(r.Created_Time) : new Date(),
        },
      );
      await log(id, "bigin", "Imported from Zoho Bigin", userId);
      created += 1;
    }
  }

  // local deals Bigin has not got (made before connecting, or a failed push)
  const pending = await q("SELECT id FROM crm_deals WHERE biginId IS NULL ORDER BY createdAt LIMIT 200");
  let pushed = 0;
  let failed = 0;
  for (const p of pending) {
    try {
      await pushNow(p.id);
      pushed += 1;
    } catch {
      failed += 1;
    }
  }
  const result = { fromBigin: rows.length, created, updated, unchanged, pushed, failed, at: new Date().toISOString() };
  await bigin.recordSync(result);
  return result;
}

let timer = null;
/** Every 15 minutes while Bigin is connected and auto-sync is on. */
function startAutoSync() {
  if (timer || process.env.CRM_AUTO_SYNC === "0") return;
  timer = setInterval(async () => {
    try {
      const crm = await getSetting("crm");
      if (crm.autoSync && (await bigin.connection())) await syncWithBigin({});
    } catch {
      /* next round */
    }
  }, 15 * 60 * 1000);
  timer.unref?.();
}

module.exports = {
  STAGES,
  meta,
  board,
  list,
  getDeal,
  createDeal,
  updateDeal,
  setStage,
  deleteDeal,
  addNote,
  addTask,
  updateTask,
  deleteTask,
  tasks,
  ensureCustomer,
  linkQuotation,
  forCustomer,
  followLinkedDocuments,
  pushNow,
  syncWithBigin,
  startAutoSync,
};
