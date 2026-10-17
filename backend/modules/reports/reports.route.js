const express = require("express");
const { auth } = require("../../middleware/auth");
const { can } = require("../../middleware/permission");
const { REPORTS, catalogue, runReport } = require("./reports.service");

const router = express.Router();
router.use(auth);

// GET /api/reports → the reports this user may run
router.get("/", async (req, res) => {
  const list = [];
  for (const r of catalogue()) if (await can(req.user, r.module, "view")) list.push(r);
  res.json({ data: list });
});

// GET /api/reports/:key?from&to&group&days
router.get("/:key", async (req, res) => {
  const r = REPORTS[req.params.key];
  if (!r) return res.status(404).json({ message: "Unknown report" });
  if (!(await can(req.user, r.module, "view"))) {
    return res.status(403).json({ message: `You need view permission on ${r.module} for this report.` });
  }
  try {
    res.json(await runReport(req.params.key, req.query));
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Report failed" });
  }
});

module.exports = router;
