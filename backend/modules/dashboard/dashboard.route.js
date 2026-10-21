const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/permission');
const { getSummary } = require('./dashboard.controller');

router.use(auth);
router.get('/summary', requirePermission('orders', 'view'), getSummary);
// Each section checks its own permission
router.get('/my-day', require('./myday').myDay);

// Owner's daily summary: preview, and send now (admins)
const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'];
router.get('/daily-summary', requirePermission('orders', 'view'), async (req, res) => {
  try {
    const { buildSummary } = require('./daily-summary');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : undefined;
    res.json(await buildSummary(date));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/daily-summary/send', async (req, res) => {
  if (!(req.user.roles || []).some((r) => ADMIN.includes(r)))
    return res.status(403).json({ message: 'Administrators only.' });
  try {
    res.json(await require('./daily-summary').sendSummary(req.body?.date));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
