const EXPORT_DEFAULTS = {
  quotation: '{customer} - {number} - {date}',
  order: '{customer} - {number} - {date}',
  purchase: '{customer} - {number} - {date}',
  dateFormat: 'DD-MM-YYYY',
};
const EXTRA_DEFAULTS = { documentExports: EXPORT_DEFAULTS, apps: { entries: [] } };
const invalid = (message) => {
  throw Object.assign(new Error(message), { status: 400 });
};
function validateConfiguration(key, patch) {
  if (key === 'documentExports') {
    for (const type of ['quotation', 'order', 'purchase']) {
      if (
        patch[type] !== undefined &&
        (typeof patch[type] !== 'string' ||
          patch[type].length > 180 ||
          !patch[type].includes('{number}') ||
          /[\\/:*?"<>|\x00-\x1f]/.test(patch[type]) ||
          /\{[^}]*\}/g.test(patch[type].replace(/\{(customer|number|date)\}/g, '')))
      )
        invalid('Filename formats must include {number} and may use {customer} and {date}.');
    }
    if (
      patch.dateFormat !== undefined &&
      !['DD-MM-YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'].includes(patch.dateFormat)
    )
      invalid('Invalid date format');
  }
  if (key === 'apps') {
    if (!Array.isArray(patch.entries) || patch.entries.length > 50) invalid('Invalid app registry');
    const keys = new Set();
    for (const app of patch.entries) {
      if (
        !app ||
        !/^[a-z][a-z0-9-]{0,49}$/.test(app.key) ||
        keys.has(app.key) ||
        typeof app.name !== 'string' ||
        !app.name.trim() ||
        app.name.length > 80 ||
        !Array.isArray(app.lockedRoles) ||
        app.lockedRoles.some((r) => typeof r !== 'string' || r.length > 80) ||
        (app.enabled !== undefined && typeof app.enabled !== 'boolean')
      )
        invalid('Invalid app registry entry');
      keys.add(app.key);
      if (
        app.custom &&
        (typeof app.home !== 'string' ||
          !/^\/(?!\/)[a-zA-Z0-9/?=&_%.-]+$/.test(app.home) ||
          (!app.adminOnly && !/^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/.test(app.module || '')))
      )
        invalid('Custom apps require an internal page and permission module');
    }
  }
}
module.exports = { EXTRA_DEFAULTS, validateConfiguration };
