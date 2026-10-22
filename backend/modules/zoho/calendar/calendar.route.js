const router = require('express').Router();
const service = require('./calendar.service');
const auth = require('../zoho.auth');
const wrap = require('../planning.wrap');
router.get(
  '/status',
  wrap(async (req) => ({
    connected: (await auth.status(req.user.userId)).services.calendar,
    capabilities: ['read'],
  })),
);
router.get(
  '/calendars',
  wrap((req) => service.calendars(req.user.userId, req.query)),
);
router.get(
  '/calendars/:calendarId/events',
  wrap((req) => service.events(req.user.userId, req.params.calendarId, req.query)),
);
module.exports = router;
