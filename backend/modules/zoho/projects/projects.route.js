const router = require('express').Router();
const service = require('./projects.service');
const auth = require('../zoho.auth');
const wrap = require('../planning.wrap');
router.get(
  '/status',
  wrap(async (req) => ({
    connected: (await auth.status(req.user.userId)).services.projects,
    capabilities: ['read'],
  })),
);
router.get(
  '/portals',
  wrap((req) => service.portals(req.user.userId)),
);
router.get(
  '/portals/:portalId/projects',
  wrap((req) => service.projects(req.user.userId, req.params.portalId, req.query)),
);
router.get(
  '/portals/:portalId/projects/:projectId/tasks',
  wrap((req) =>
    service.tasks(req.user.userId, req.params.portalId, req.params.projectId, req.query),
  ),
);
module.exports = router;
