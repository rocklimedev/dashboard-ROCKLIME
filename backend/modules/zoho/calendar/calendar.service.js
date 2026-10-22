const { request } = require('../planning.client');
const { Joi, validate, fail } = require('../../planning/validation');
const utc = (value) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
module.exports = {
  calendars(userId, query) {
    const params = validate(
      Joi.object({
        category: Joi.string().valid('own', 'group', 'app', 'others', 'all').default('own'),
      }),
      query,
    );
    return request(userId, 'calendar', '/api/v1/calendars', params);
  },
  events(userId, calendarId, query) {
    const id = validate(
      Joi.string()
        .pattern(/^[a-zA-Z0-9_+=@.-]{1,200}$/)
        .required(),
      calendarId,
    );
    const { start, end } = validate(
      Joi.object({
        start: Joi.string().isoDate().required(),
        end: Joi.string().isoDate().required(),
      }),
      query,
    );
    const duration = Date.parse(end) - Date.parse(start);
    if (duration <= 0 || duration > 31 * 86400000)
      throw fail('Event range must be positive and no longer than 31 days.');
    return request(userId, 'calendar', `/api/v1/calendars/${encodeURIComponent(id)}/events`, {
      range: JSON.stringify({ start: utc(start), end: utc(end) }),
    });
  },
};
