// ---------------------------------------------------------------------------
// Role-based access control.
//
// A permission is a (module, action) pair stored in the `permissions` table and
// granted to roles through `rolepermissions`. Actions: view, write, edit,
// delete, export. A role that holds ANY permission row with the right module
// and action passes, whatever that row's name or route says, so older,
// route-specific rows keep working.
//
// SUPER_ADMIN always passes. Each role's permission set is cached for
// ROLE_CACHE_MS and cleared whenever roles or permissions change.
// ---------------------------------------------------------------------------
const ROLE_CACHE_MS = Number(process.env.PERMISSION_CACHE_MS) || 60 * 1000;
const roleCache = new Map();

const BYPASS_ROLES = new Set(['SUPER_ADMIN']);
const ACTIONS = new Set(['view', 'write', 'edit', 'delete', 'export']);
const METHOD_ACTION = {
  GET: 'view',
  HEAD: 'view',
  OPTIONS: null,
  POST: 'write',
  PUT: 'edit',
  PATCH: 'edit',
  DELETE: 'delete',
};

async function loadRolePermissions(roleId) {
  const hit = roleCache.get(roleId);
  if (hit && Date.now() - hit.at < ROLE_CACHE_MS) return hit.value;

  const { Role, RolePermission, Permission } = require('../models');
  const role = await Role.findByPk(roleId, {
    attributes: ['roleId', 'roleName'],
    include: [
      {
        model: RolePermission,
        as: 'rolepermissions',
        attributes: ['permissionId'],
        include: [{ model: Permission, as: 'permission', attributes: ['module', 'api'] }],
      },
    ],
  });
  const value = role
    ? {
        roleName: role.roleName,
        grants: new Set(
          (role.rolepermissions || [])
            .filter((rp) => rp.permission)
            .map((rp) => `${rp.permission.module}:${rp.permission.api}`),
        ),
      }
    : null;
  roleCache.set(roleId, { at: Date.now(), value });
  return value;
}

const clearPermissionCache = () => roleCache.clear();

/** True when the authenticated user may perform `action` in `module`. */
async function can(user, module, action) {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (roles.some((r) => BYPASS_ROLES.has(r))) return true;
  if (!user.roleId) return false;
  const perms = await loadRolePermissions(user.roleId);
  if (!perms) return false;
  if (BYPASS_ROLES.has(perms.roleName)) return true;
  return perms.grants.has(`${module}:${action}`);
}

const deny = (res, module, action) =>
  res.status(403).json({
    message: `Forbidden: you need "${action}" permission on ${module}.`,
    module,
    action,
  });

/** Route middleware: requires `action` on `module`. Must run after `auth`. */
const requirePermission = (module, action) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not logged in.' });
  try {
    if (await can(req.user, module, action)) return next();
    return deny(res, module, action);
  } catch (err) {
    next(err);
  }
};

/**
 * Router-level guard: the action comes from the HTTP method (GET = view,
 * POST = write, PUT/PATCH = edit, DELETE = delete). `rules` adjusts specific
 * paths: [{ method, path: RegExp, module?, action? | skip: true }]. A rule
 * with `skip` only needs a logged-in user (for self-service endpoints).
 */
const guardModule =
  (module, rules = []) =>
  async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not logged in.' });
    const rule = rules.find((r) => (!r.method || r.method === req.method) && r.path.test(req.path));
    if (rule?.skip) return next();
    const action = rule?.action || METHOD_ACTION[req.method];
    if (!action) return next();
    try {
      if (await can(req.user, rule?.module || module, action)) return next();
      return deny(res, rule?.module || module, action);
    } catch (err) {
      next(err);
    }
  };

/**
 * Backwards-compatible signature used by the route files:
 * checkPermission(api, name, module, route). Only module + action are checked.
 */
const checkPermission = (api, _name, module) => {
  const action = api === 'post' ? 'write' : api;
  if (!ACTIONS.has(action)) {
    throw new Error(`checkPermission: unknown action "${api}" for module "${module}"`);
  }
  return requirePermission(module, action);
};

/** Clears cached permissions after any successful change request. */
const clearCacheOnWrite = (req, res, next) => {
  if (req.method !== 'GET') {
    res.on('finish', () => {
      if (res.statusCode < 400) clearPermissionCache();
    });
  }
  next();
};

module.exports = checkPermission;
module.exports.checkPermission = checkPermission;
module.exports.requirePermission = requirePermission;
module.exports.guardModule = guardModule;
module.exports.can = can;
module.exports.clearPermissionCache = clearPermissionCache;
module.exports.clearCacheOnWrite = clearCacheOnWrite;
