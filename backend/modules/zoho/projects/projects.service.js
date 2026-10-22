const { request } = require('../planning.client');
const { Joi, validate } = require('../../planning/validation');
const identifier = (value) =>
  validate(
    Joi.string()
      .pattern(/^\d{1,40}$/)
      .required(),
    value,
  );
const pagination = (query) =>
  validate(
    Joi.object({
      page: Joi.number().integer().min(1).max(100000).default(1),
      per_page: Joi.number().integer().min(1).max(200).default(100),
    }),
    query,
  );
module.exports = {
  portals: (userId) => request(userId, 'projects', '/api/v3.1/portals'),
  projects: (userId, portalId, query) =>
    request(
      userId,
      'projects',
      `/api/v3/portal/${identifier(portalId)}/projects`,
      pagination(query),
    ),
  tasks: (userId, portalId, projectId, query) =>
    request(
      userId,
      'projects',
      `/api/v3/portal/${identifier(portalId)}/projects/${identifier(projectId)}/tasks`,
      pagination(query),
    ),
};
