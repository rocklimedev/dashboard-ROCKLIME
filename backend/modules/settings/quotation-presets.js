const { randomUUID } = require('node:crypto');
const bad = (message) => Object.assign(new Error(message), { status: 400 });
function seed(settings) {
  return [
    {
      id: 'generic',
      name: 'Generic',
      discountMode: 'generic',
      gstBasis: null,
      gstRate: Number(settings.defaultGstRate),
      isDefault: true,
    },
  ];
}
function validatePresets(rows) {
  if (!Array.isArray(rows)) throw bad('discountPresets must be a list');
  const ids = new Set();
  let defaults = 0;
  for (const p of rows) {
    if (
      !p ||
      typeof p.id !== 'string' ||
      !p.id ||
      ids.has(p.id) ||
      typeof p.name !== 'string' ||
      !p.name.trim() ||
      p.name.length > 120 ||
      !['generic', 'advanced'].includes(p.discountMode) ||
      ![null, 'inclusive', 'exclusive'].includes(p.gstBasis) ||
      (p.discountMode === 'advanced' && p.gstBasis === null) ||
      typeof p.gstRate !== 'number' ||
      !Number.isFinite(p.gstRate) ||
      p.gstRate < 0 ||
      typeof p.isDefault !== 'boolean'
    )
      throw bad('Invalid quotation discount preset');
    ids.add(p.id);
    if (p.isDefault) defaults++;
  }
  if (defaults > 1) throw bad('Only one quotation discount preset can be default');
}
// Serialize mutations so concurrent requests in this process cannot overwrite a preset list.
let pending = Promise.resolve();
function mutatePreset(method, id, body, userId) {
  const run = pending.then(async () => {
    const { getSetting, saveSetting } = require('./settings.service');
    const settings = await getSetting('quotation');
    let rows = settings.discountPresets.map((p) => ({ ...p }));
    if (method !== 'POST' && !rows.some((p) => p.id === id))
      throw Object.assign(new Error('Preset not found'), { status: 404 });
    if (method === 'DELETE') rows = rows.filter((p) => p.id !== id);
    else {
      const value = {
        ...(method === 'PUT' ? rows.find((p) => p.id === id) : {}),
        ...body,
        id: method === 'POST' ? randomUUID() : id,
      };
      if (value.isDefault)
        rows.forEach((p) => {
          p.isDefault = false;
        });
      rows = method === 'POST' ? [...rows, value] : rows.map((p) => (p.id === id ? value : p));
    }
    validatePresets(rows);
    await saveSetting('quotation', { discountPresets: rows }, userId);
    return rows;
  });
  pending = run.catch(() => {});
  return run;
}
module.exports = { seed, validatePresets, mutatePreset };
