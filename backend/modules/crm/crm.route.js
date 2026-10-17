// CRM app API (mounted at /api/crm)
//
//   GET    /meta                          stages, sources, owners, tags
//   GET    /board?q&owner&source&tag&stage&customerType&closing&followUp&bigin&sort
//   GET    /deals?…&page&limit            list view
//   POST   /deals                         new deal
//   GET    /deals/:id                     deal with activity, follow-ups, quotations, orders
//   PUT    /deals/:id                     change details (and stage)
//   PUT    /deals/:id/stage               { stage, lostReason }
//   DELETE /deals/:id
//   POST   /deals/:id/notes               { text, kind: note|call|visit|whatsapp|email }
//   POST   /deals/:id/tasks               { title, dueDate, assignedTo }
//   PUT    /tasks/:taskId                 { done, title, dueDate, outcome }
//   DELETE /tasks/:taskId
//   GET    /tasks?scope=mine|all&when=due|week|all
//   POST   /deals/:id/customer            find or create the customer
//   POST   /deals/:id/quotation           { quotationId } link a quotation
//   GET    /customer/:customerId          deals of a customer
//
//   Zoho Bigin (administrators connect; anyone with CRM view sees the status)
//   GET    /bigin/status
//   GET    /bigin/authorize               → { url } consent page
//   GET    /bigin/callback                Zoho redirects here (no login; signed state)
//   POST   /bigin/token                   { refreshToken, accountsUrl } Self Client
//   GET    /bigin/pipelines               Bigin pipelines and their stages
//   POST   /bigin/sync                    { full } pull + push now
//   POST   /bigin/push/:id                send one deal now
//   DELETE /bigin                         disconnect
const express = require("express");
const { auth } = require("../../middleware/auth");
const { guardModule } = require("../../middleware/permission");
const { signShare, verifyShare } = require("../../lib/shareToken");
const crm = require("./crm.service");
const bigin = require("./bigin");

const router = express.Router();
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "DEVELOPER"];
const isAdmin = (u) => (u?.roles || []).some((r) => ADMIN_ROLES.includes(r));
const frontend = () => (process.env.CLIENT_URL || process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");
const wrap = (fn) => async (req, res) => {
  try {
    const out = await fn(req, res);
    if (!res.headersSent) res.json(out);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "CRM request failed", ...(err.zohoCode ? { zohoCode: err.zohoCode } : {}) });
  }
};
const adminOnly = (req, res, next) =>
  isAdmin(req.user) ? next() : res.status(403).json({ message: "Only an administrator can connect or change Zoho Bigin." });

// Zoho comes back here in the browser, without our login token
router.get("/bigin/callback", async (req, res) => {
  const back = (qs) => res.redirect(`${frontend()}/crm/settings?${qs}`);
  try {
    if (req.query.error) return back(`bigin=error&message=${encodeURIComponent(String(req.query.error))}`);
    const state = verifyShare(req.query.state);
    if (!state || state.t !== "bigin") return back("bigin=error&message=The%20link%20expired%2C%20try%20again");
    await bigin.exchangeCode(String(req.query.code || ""), req.query["accounts-server"], state.u);
    back("bigin=connected");
  } catch (err) {
    back(`bigin=error&message=${encodeURIComponent(err.message || "Could not connect")}`);
  }
});

router.use(auth);
router.use(
  guardModule("crm", [
    { path: /^\/bigin/, method: "GET", action: "view" },
    { path: /^\/bigin/, action: "view" }, // admin check below
    { method: "POST", path: /^\/deals\/[^/]+\/(notes|tasks|customer|quotation)$/, action: "edit" },
  ]),
);

router.get("/meta", wrap(() => crm.meta()));
router.get("/board", wrap((req) => crm.board({ ...req.query, userId: req.user.userId })));
router.get("/deals", wrap((req) => crm.list({ ...req.query, userId: req.user.userId })));
router.post("/deals", wrap(async (req, res) => {
  const deal = await crm.createDeal(req.body || {}, req.user);
  res.status(201).json({ deal, message: "Deal added" });
}));
router.get("/deals/:id", wrap((req) => crm.getDeal(req.params.id)));
router.put("/deals/:id", wrap(async (req) => ({ deal: await crm.updateDeal(req.params.id, req.body || {}, req.user), message: "Saved" })));
router.put("/deals/:id/stage", wrap(async (req) => {
  await crm.setStage(req.params.id, req.body?.stage, { reason: req.body?.lostReason, userId: req.user.userId });
  return { deal: (await crm.getDeal(req.params.id)).deal, message: "Stage changed" };
}));
router.delete("/deals/:id", wrap((req) => crm.deleteDeal(req.params.id, req.user)));
router.post("/deals/:id/notes", wrap((req) => crm.addNote(req.params.id, req.body?.text, req.user, req.body?.kind)));
router.post("/deals/:id/tasks", wrap((req) => crm.addTask(req.params.id, req.body || {}, req.user)));
router.put("/tasks/:taskId", wrap((req) => crm.updateTask(req.params.taskId, req.body || {}, req.user)));
router.delete("/tasks/:taskId", wrap((req) => crm.deleteTask(req.params.taskId)));
router.get("/tasks", wrap((req) => crm.tasks({ userId: req.user.userId, scope: req.query.scope, when: req.query.when })));
router.post("/deals/:id/customer", wrap((req) => crm.ensureCustomer(req.params.id, req.user)));
router.post("/deals/:id/quotation", wrap(async (req) => ({ deal: await crm.linkQuotation(req.params.id, req.body?.quotationId, req.user), message: "Quotation linked" })));
router.get("/customer/:customerId", wrap((req) => crm.forCustomer(req.params.customerId)));

// ---------------- Bigin
router.get("/bigin/status", wrap(() => bigin.status()));
router.get("/bigin/authorize", adminOnly, wrap((req) => {
  const state = signShare({ t: "bigin", u: req.user.userId }, 1 / 96); // 15 minutes
  return { url: bigin.authorizeUrl(state, req.query.accountsUrl) };
}));
router.post("/bigin/token", adminOnly, wrap(async (req) => {
  await bigin.connectWithRefreshToken(req.body?.refreshToken, req.body?.accountsUrl, req.user.userId);
  return { ...(await bigin.status()), message: "Zoho Bigin connected" };
}));
router.get("/bigin/pipelines", wrap(() => bigin.pipelineStages()));
router.post("/bigin/sync", wrap(async (req) => ({ result: await crm.syncWithBigin({ userId: req.user.userId, full: !!req.body?.full }), message: "Synced with Bigin" })));
router.post("/bigin/push/:id", wrap((req) => crm.pushNow(req.params.id)));
router.delete("/bigin", adminOnly, wrap(async () => {
  await bigin.disconnect();
  return { message: "Zoho Bigin disconnected" };
}));

crm.startAutoSync();

module.exports = router;
