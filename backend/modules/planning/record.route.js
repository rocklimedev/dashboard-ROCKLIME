const { Router } = require('express');
const { auth } = require('../../middleware/auth');
const { Joi, validate } = require('./validation');
const createService = require('./record.service');
module.exports = (Model, kind) => {
  const router = Router();
  const service = createService(Model, kind);
  const wrap = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (!error.status) console.error(`[${kind}]`, error.message);
      res
        .status(error.status || 500)
        .json({ message: error.status ? error.message : 'Could not save or load planning data.' });
    }
  };
  const id = (req) => validate(Joi.string().uuid().required(), req.params.id);
  const version = (input) => validate(Joi.number().integer().min(1).required(), input);
  // These are personal workspaces. Ownership is enforced on every query;
  // administrators do not implicitly gain access to another user's records.
  router.use(auth);
  router.get(
    '/',
    wrap(async (req, res) => {
      const pagination = validate(
        Joi.object({
          page: Joi.number().integer().min(1).max(100000).default(1),
          limit: Joi.number().integer().min(1).max(200).default(100),
        }),
        req.query,
      );
      res.json(await service.list(req.user.userId, pagination));
    }),
  );
  router.get(
    '/:id',
    wrap(async (req, res) => res.json(await service.get(req.user.userId, id(req)))),
  );
  router.post(
    '/',
    wrap(async (req, res) => res.status(201).json(await service.create(req.user.userId, req.body))),
  );
  router.patch(
    '/:id',
    wrap(async (req, res) => {
      const { version: revision, ...input } = req.body || {};
      res.json(await service.update(req.user.userId, id(req), input, version(revision)));
    }),
  );
  router.delete(
    '/:id',
    wrap(async (req, res) => {
      await service.remove(req.user.userId, id(req), version(req.body?.version));
      res.status(204).end();
    }),
  );
  return router;
};
