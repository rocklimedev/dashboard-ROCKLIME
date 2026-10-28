const { getSetting } = require('../modules/settings/settings.service');
const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'];
const APP_MODULES = {
  crm: 'crm',
  quotations: 'quotations',
  orders: 'orders',
  operations: 'inventory',
  purchase: 'purchase_orders',
  catalogue: 'products',
  accounts: 'orders',
  reports: 'reports',
  settings: 'settings',
};
const API_APPS = {
  customers: 'settings',
  roles: 'settings',
  permission: 'settings',
  'role-permissions': 'settings',
  activity: 'settings',
  quotation: 'quotations',
  order: 'orders',
  'purchase-orders': 'purchase',
  fgs: 'purchase',
  vendors: 'purchase',
  products: 'catalogue',
  brands: 'catalogue',
  category: 'catalogue',
  'parent-categories': 'catalogue',
  'product-meta': 'catalogue',
  'brand-parent': 'catalogue',
  keyword: 'catalogue',
  stock: 'operations',
  operations: 'operations',
  jobs: 'operations',
  payments: 'accounts',
  invoices: 'accounts',
  reports: 'reports',
  dashboard: 'reports',
  crm: 'crm',
  catalogues: 'catalogue',
};
function lockedApp(entries, user, module, appKey) {
  if ((user.roles || []).some((r) => ADMIN.includes(r))) return null;
  return entries.find(
    (app) =>
      (app.custom
        ? app.module === module
        : appKey
          ? app.key === appKey
          : APP_MODULES[app.key] === module) &&
      (app.enabled === false || app.lockedRoles?.some((r) => (user.roles || []).includes(r))),
  );
}
async function checkAppLock(req, user) {
  const segment = /^\/api\/([^/?]+)/.exec(req.originalUrl || '')?.[1];
  let appKey = API_APPS[segment];
  if (segment === 'carts') {
    const type = req.body?.documentType || req.query?.documentType;
    appKey =
      type === 'order'
        ? 'orders'
        : type === 'purchase-order'
          ? 'purchase'
          : type === 'quotation'
            ? 'quotations'
            : null;
  }
  // Dispatch and receiving endpoints belong to Operations even under /order.
  if (segment === 'order' && /\/dispatch(?:\/|$)|\/stock(?:\/|$)/.test(req.originalUrl))
    appKey = 'operations';
  if (!appKey || (user.roles || []).some((r) => ADMIN.includes(r))) return null;
  const { entries } = await getSetting('apps');
  return lockedApp(entries || [], user, APP_MODULES[appKey], appKey);
}
module.exports = { checkAppLock, lockedApp, APP_MODULES };
