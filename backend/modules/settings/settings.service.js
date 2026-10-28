// Key/value app settings (company details, quotation defaults), stored as JSON
// in app_settings. Reads merge the saved value over the defaults, so a new
// default field shows up without a migration.
const sequelize = require('../../config/database');
const { DEFAULTS: BASE_DEFAULTS } = require('../../migrations/20261016000100-app-settings');
const { EXTRA_DEFAULTS, validateConfiguration } = require('./admin-configuration');
const DEFAULTS = { ...BASE_DEFAULTS, ...EXTRA_DEFAULTS };

const KEYS = Object.keys(DEFAULTS);
const cache = new Map();
const TTL = 60 * 1000;

async function getSetting(key) {
  if (!KEYS.includes(key)) throw Object.assign(new Error('Unknown setting'), { status: 404 });
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  let saved = {};
  try {
    const [rows] = await sequelize.query('SELECT value FROM app_settings WHERE `key` = ?', {
      replacements: [key],
    });
    if (rows[0]) saved = JSON.parse(rows[0].value);
  } catch {
    saved = {};
  }
  const value = { ...DEFAULTS[key], ...saved };
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function saveSetting(key, patch, userId) {
  if (!KEYS.includes(key)) throw Object.assign(new Error('Unknown setting'), { status: 404 });
  validateConfiguration(key, patch);
  const current = await getSetting(key);
  const allowed = Object.keys(DEFAULTS[key]);
  const next = { ...current };
  for (const f of allowed) if (patch[f] !== undefined) next[f] = patch[f];
  await sequelize.query(
    'INSERT INTO app_settings (`key`, value, updatedBy, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW()) ' +
      'ON DUPLICATE KEY UPDATE value = VALUES(value), updatedBy = VALUES(updatedBy), updatedAt = NOW()',
    { replacements: [key, JSON.stringify(next), userId || null] },
  );
  cache.delete(key);
  return next;
}

module.exports = { getSetting, saveSetting, KEYS };
