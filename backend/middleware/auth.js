const jwt = require('jsonwebtoken');
const { secret, tokenLife } = require('../config/keys').jwt;

// ---------------------------------------------------------------------------
// The token proves who the caller is; the database decides whether they may
// still use the system. Each user's status, role and roles are cached for
// USER_CACHE_MS so a deactivated user loses access within a minute instead of
// keeping it until the token expires.
// ---------------------------------------------------------------------------
const USER_CACHE_MS = Number(process.env.AUTH_USER_CACHE_MS) || 60 * 1000;
const userCache = new Map();

const toRoleArray = (roles) => {
  if (Array.isArray(roles)) return roles.filter(Boolean);
  if (typeof roles === 'string')
    return roles
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
  return [];
};

async function loadUser(userId) {
  const hit = userCache.get(userId);
  if (hit && Date.now() - hit.at < USER_CACHE_MS) return hit.user;

  // Required lazily so this file can be loaded before the models are ready.
  const { User } = require('../models');
  const row = await User.findByPk(userId, {
    attributes: ['userId', 'username', 'name', 'email', 'roles', 'roleId', 'status'],
  });
  const user = row
    ? {
        userId: row.userId,
        username: row.username,
        name: row.name,
        email: row.email,
        roles: toRoleArray(row.roles),
        roleId: row.roleId,
        status: row.status,
      }
    : null;
  userCache.set(userId, { at: Date.now(), user });
  return user;
}

const invalidateUserCache = (userId) => {
  if (userId) userCache.delete(userId);
  else userCache.clear();
};

const auth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header is missing.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], secret);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  try {
    const user = decoded.userId ? await loadUser(decoded.userId) : null;
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    if (user.status !== 'active') {
      return res
        .status(403)
        .json({ error: 'Your account is not active. Contact an administrator.' });
    }
    if (!user.roles.length) {
      return res.status(403).json({ error: 'Unauthorized: Missing roles.' });
    }
    const appLock = await require('./app-lock').checkAppLock(req, user);
    if (appLock) return res.status(403).json({ message: 'This app is locked for your role.', app: appLock.key });
    // Fresh values from the database win over whatever the token carried.
    req.user = { ...decoded, ...user };
    next();
  } catch (error) {
    next(error);
  }
};

const isAdmin = (user) =>
  toRoleArray(user?.roles).some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));

const generateToken = (user) =>
  jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      roles: toRoleArray(user.roles).length ? toRoleArray(user.roles) : ['USERS'],
      roleId: user.roleId,
    },
    secret,
    { expiresIn: tokenLife },
  );

module.exports = { auth, generateToken, invalidateUserCache, isAdmin, toRoleArray };
