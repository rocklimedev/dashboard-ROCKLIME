const Joi = require('joi');
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const text = (max) => Joi.string().trim().max(max).allow('').default('');
const common = { title: Joi.string().trim().min(1).max(200).required(), description: text(10000) };
const task = Joi.object({
  ...common,
  project: text(200),
  status: Joi.string().valid('Open', 'In progress', 'Completed').default('Open'),
  priority: Joi.string().valid('Low', 'Normal', 'High').default('Normal'),
  dueDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .default(null),
});
const event = Joi.object({
  ...common,
  location: text(500),
  startAt: Joi.string().isoDate().required(),
  endAt: Joi.string().isoDate().required(),
  timeZone: Joi.string().max(100).required(),
});
function validate(schema, input) {
  const { value, error } = schema.validate(input, { abortEarly: true });
  if (error) throw fail(error.details[0].message);
  return value;
}
function record(kind, input) {
  const data = validate(kind === 'tasks' ? task : event, input);
  if (
    data.dueDate &&
    (Number.isNaN(Date.parse(data.dueDate)) ||
      new Date(data.dueDate).toISOString().slice(0, 10) !== data.dueDate)
  )
    throw fail('Invalid due date');
  if (kind !== 'tasks') {
    if (Date.parse(data.endAt) <= Date.parse(data.startAt)) throw fail('End must be after start');
    try {
      new Intl.DateTimeFormat('en', { timeZone: data.timeZone });
    } catch {
      throw fail('Invalid time zone');
    }
    data.startAt = new Date(data.startAt).toISOString();
    data.endAt = new Date(data.endAt).toISOString();
  }
  return data;
}
module.exports = { Joi, validate, record, fail };
