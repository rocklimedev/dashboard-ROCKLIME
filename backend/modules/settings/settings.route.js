const express = require('express');
const { auth } = require('../../middleware/auth');
const { getSetting, saveSetting, KEYS } = require('./settings.service');

const router = express.Router();
router.use(auth);

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'];

// GET /api/settings → all settings; GET /api/settings/:key → one
router.get('/', async (req, res, next) => {
  try {
    const out = {};
    for (const k of KEYS) out[k] = await getSetting(k);
    res.json({ data: out });
  } catch (err) {
    next(err);
  }
});
router.get('/:key', async (req, res) => {
  try {
    res.json({ data: await getSetting(req.params.key) });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// PUT /api/settings/:key — administrators only
router.put('/:key', async (req, res) => {
  if (!(req.user.roles || []).some((r) => ADMIN_ROLES.includes(r))) {
    return res.status(403).json({ message: 'Only administrators can change settings.' });
  }
  try {
    res.json({
      data: await saveSetting(req.params.key, req.body || {}, req.user.userId),
      message: 'Settings saved',
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

module.exports = router;
