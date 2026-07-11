const logActivity = require("../utils/activityLogger");
const { ActivityLog } = require("../models");

/**
 * Log user creation activity
 */
exports.logUserCreated = async (userId, newUser, roleData, addressId, req) => {
  logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
    subContext: ActivityLog.SUB_CONTEXTS.USER,
    action: "USER_CREATED",
    entityId: newUser.userId,
    entityName: newUser.name || newUser.username,
    description: `User "${newUser.username}" was created`,
    newValues: {
      userId: newUser.userId,
      username: newUser.username,
      email: newUser.email,
      role: roleData.roleName,
      status: newUser.status,
    },
    metadata: {
      roleId: roleData.roleId,
      addressId,
    },
    req,
  }).catch(console.error);
};

/**
 * Log user deletion activity
 */
exports.logUserDeleted = async (user, req) => {
  await logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
    subContext: ActivityLog.SUB_CONTEXTS.USER,
    action: "USER_DELETED",
    entityId: user.userId,
    entityName: user.name || user.username,
    description: `User "${user.username}" was deleted`,
    oldValues: {
      userId: user.userId,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.roles,
      status: user.status,
    },
    req,
  });
};

/**
 * Log user status change activity
 */
exports.logUserStatusChanged = async (user, oldStatus, newStatus, req) => {
  logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
    subContext: ActivityLog.SUB_CONTEXTS.USER,
    action: "USER_STATUS_CHANGED",
    entityId: user.userId,
    entityName: user.name || user.username,
    description: `User "${user.username}" status changed from ${oldStatus} to ${newStatus}`,
    oldValues: {
      status: oldStatus,
    },
    newValues: {
      status: newStatus,
    },
    metadata: {
      changedBy: req.user?.userId || null,
    },
    req,
  }).catch(console.error);
};

/**
 * Log user role assignment activity
 */
exports.logUserRoleAssigned = async (user, oldValues, newValues, req) => {
  logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
    subContext: ActivityLog.SUB_CONTEXTS.USER,
    action: "USER_ROLE_ASSIGNED",
    entityId: user.userId,
    entityName: user.name || user.username,
    description: `Role changed for user "${user.username}" from "${oldValues.role}" to "${newValues.role}"`,
    oldValues,
    newValues,
    metadata: {
      assignedBy: req.user?.userId || null,
    },
    req,
  }).catch(console.error);
};

/**
 * Log user status update activity
 */
exports.logUserStatusUpdated = async (user, oldStatus, newStatus, req) => {
  logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
    subContext: ActivityLog.SUB_CONTEXTS.USER,
    action: "USER_STATUS_UPDATED",
    entityId: user.userId,
    entityName: user.name || user.username,
    description: `Status changed for user "${user.username}" from "${oldStatus}" to "${newStatus}"`,
    oldValues: {
      status: oldStatus,
    },
    newValues: {
      status: newStatus,
    },
    metadata: {
      changedBy: req.user?.userId || null,
    },
    req,
  }).catch(console.error);
};
