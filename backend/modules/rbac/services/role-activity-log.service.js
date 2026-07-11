const logActivity = require("../utils/activityLogger");
const { ActivityLog } = require("../models");

/**
 * Log role assignment to user
 */
exports.logRoleAssignedToUser = async (
  userId,
  assignedRole,
  oldValues,
  newValues,
  req,
) => {
  await logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.AUTH,
    subContext: ActivityLog.SUB_CONTEXTS.USER,
    action: "ASSIGN_ROLE",
    entityId: userId,
    entityName: userId,
    description: `Role ${assignedRole} assigned to user`,
    oldValues,
    newValues,
    metadata: {
      assignedRole,
      roleId: newValues.roleId,
      isSuperAdminAttempt: assignedRole === "SuperAdmin",
      statusChange: newValues.status,
      userId,
    },
    req,
  });
};

/**
 * Log role creation
 */
exports.logRoleCreated = async (newRole, req) => {
  await logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.SYSTEM,
    subContext: ActivityLog.SUB_CONTEXTS.ROLE,
    action: "CREATE_ROLE",
    entityId: newRole.roleId,
    entityName: newRole.roleName,
    description: `Role "${newRole.roleName}" created`,
    metadata: {
      roleId: newRole.roleId,
      roleName: newRole.roleName,
      createdVia: "ADMIN_PANEL",
    },
    req,
  });
};

/**
 * Log role deletion
 */
exports.logRoleDeleted = async (role, req) => {
  await logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.SYSTEM,
    subContext: ActivityLog.SUB_CONTEXTS.ROLE,
    action: "DELETE_ROLE",
    entityId: role.roleId,
    entityName: role.roleName,
    description: `Role "${role.roleName}" deleted`,
    oldValues: {
      roleId: role.roleId,
      roleName: role.roleName,
    },
    metadata: {
      roleId: role.roleId,
      roleName: role.roleName,
      blockedDeletion: false,
      associatedUsersCount: 0,
      permissionsDeleted: true,
      severity: "critical",
      actionType: "HARD_DELETE",
    },
    req,
  });
};

/**
 * Log permission assignment to role
 */
exports.logPermissionAssignedToRole = async (
  roleId,
  roleName,
  permissionId,
  permissionName,
  req,
) => {
  await logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.SYSTEM,
    subContext: ActivityLog.SUB_CONTEXTS.ROLE,
    action: "ASSIGN_PERMISSION_TO_ROLE",
    entityId: roleId,
    entityName: roleName,
    description: `Permission assigned to role ${roleName}`,
    metadata: {
      roleId,
      roleName,
      permissionId,
      permissionName: permissionName || null,
      actionType: "PERMISSION_GRANT",
      securityImpact: "ROLE_PRIVILEGE_UPDATED",
    },
    req,
  });
};

/**
 * Log permissions removed from role
 */
exports.logPermissionsRemovedFromRole = async (
  roleId,
  roleName,
  removedPermissions,
  removedCount,
  req,
) => {
  await logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.SYSTEM,
    subContext: ActivityLog.SUB_CONTEXTS.ROLE,
    action: "REMOVE_ROLE_PERMISSIONS",
    entityId: roleId,
    entityName: roleName,
    description: `Permissions removed from role ${roleName}`,
    metadata: {
      roleId,
      removedPermissions,
      removedCount,
      securityImpact: "ROLE_PERMISSION_REVOKED",
    },
    req,
  });
};

/**
 * Log role permissions update
 */
exports.logRolePermissionsUpdated = async (
  roleId,
  roleName,
  permissions,
  req,
) => {
  await logActivity({
    userId: req.user?.userId || null,
    contextTag: ActivityLog.CONTEXT_TAGS.SYSTEM,
    subContext: ActivityLog.SUB_CONTEXTS.ROLE,
    action: "UPDATE_ROLE_PERMISSIONS",
    entityId: roleId,
    entityName: roleName,
    description: `Permissions updated for role ${roleName}`,
    oldValues: {
      permissions: "REPLACED_ALL",
    },
    newValues: {
      permissions,
    },
    metadata: {
      roleId,
      roleName,
      permissionCount: permissions.length,
      replacedAllPermissions: true,
      securityImpact: "HIGH",
    },
    req,
  });
};
