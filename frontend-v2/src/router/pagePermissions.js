import { APPS } from '../apps/registry';

// Specific routes take priority over the app's general view permission.
const MODULE_PATHS = [
  [/^\/roles-permission\/permissions\//, 'permissions'],
  [/^\/inventory\/(?:products|import|onboard-new-brand)(?:\/|$)/, 'products'],
  [/^\/fgs(?:\/|$)/, 'field_guided_sheets'],
  [/^\/(?:dispatch|disptach)(?:\/|$)|^\/orders\/dispatch/, 'orders'],
  [/^\/product\/[^/]+\/inventory$|^\/inventory/, 'inventory'],
  [/^\/(?:job|jobs)(?:\/|$)/, 'jobs'],
  [/^\/roles-permission(?:\/|$)/, 'roles'],
  [/^\/(?:user|users|u)(?:\/|$)/, 'users'],
  [/^\/meta(?:\/|$)/, 'brands'],
  [/^\/categories-keywords(?:\/|$)/, 'categories'],
  [/^\/store(?:\/|$)|^\/category-selector|^\/bulk-import$/, 'products'],
];

function owningApp(path) {
  const exact = APPS.find((entry) => entry.items.some((item) => item.to === path));
  if (exact) return exact;
  return APPS.flatMap((app) => app.match.map((prefix) => ({ app, prefix })))
    .filter(
      ({ prefix }) =>
        path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`),
    )
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]?.app;
}

export function appPermission(path) {
  const app = owningApp(path);
  return app?.module ? { module: app.module, action: 'view' } : null;
}

export function pagePermission(path) {
  // Personal pages use the signed-in user's identity rather than RBAC grants.
  if (/^\/u\/[^/]+(?:\/settings)?$/.test(path)) return null;
  const app = owningApp(path);
  const item = app?.items.find((entry) => !entry.to.includes('?') && entry.to === path);
  if (item?.adminOnly) return { adminOnly: true };
  const module =
    MODULE_PATHS.find(([pattern]) => pattern.test(path))?.[1] || item?.module || app?.module;
  if (!module) return null;
  const action = /(?:^|\/)edit(?:\/|$)/.test(path)
    ? 'edit'
    : /(?:^|\/)add(?:\/|$)/.test(path) || path.startsWith('/cart/')
      ? 'write'
      : item?.action || app?.action || 'view';
  return { module, action };
}
