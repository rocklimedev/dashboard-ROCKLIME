const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const zoho = require('./zoho.auth');
const { guardModule } = require('../../middleware/permission');
const bigin = require('../crm/bigin');
const { verifyShare } = require('../../lib/shareToken');
const clientUrl = require('../../config/clientUrl');
const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};
router.get('/callback', async (req, res) => {
  const state = verifyShare(req.query.state);
  const front = clientUrl();
  const back =
    state?.t === 'zoho' && state.u ? `/u/${encodeURIComponent(state.u)}/connectors` : '/';
  try {
    await zoho.callback(req.query);
    res.redirect(`${front}${back}?zoho=connected`);
  } catch {
    res.redirect(`${front}${back}?zoho=error`);
  }
});
router.use(auth);
router.get(
  '/status',
  wrap((req) => zoho.status(req.user.userId)),
);
router.get(
  '/authorize',
  wrap((req) => ({ url: zoho.authorize(req.user, req.query.accountsUrl) })),
);
router.delete(
  '/connection',
  wrap(async (req) => {
    await zoho.disconnect(req.user.userId);
    return { message: 'Zoho disconnected' };
  }),
);
// Service modules share the authentication layer while keeping their own APIs.
router.use('/cliq', require('./cliq/cliq.route'));
router.use('/bigin', guardModule('crm', [{ path: /^\//, action: 'view' }]));
router.get(
  '/bigin/status',
  wrap(() => bigin.status()),
);
router.get(
  '/bigin/pipelines',
  wrap(() => bigin.pipelineStages()),
);
router.post(
  '/bigin/sync',
  wrap(async (req) => ({
    result: await require('../crm/crm.service').syncWithBigin({
      userId: req.user.userId,
      full: !!req.body?.full,
    }),
    message: 'Synced with Bigin',
  })),
);
router.post(
  '/bigin/push/:id',
  wrap((req) => require('../crm/crm.service').pushNow(req.params.id)),
);
module.exports = router;
