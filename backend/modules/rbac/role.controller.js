// controllers/roleController.js
// THIN CONTROLLER — all logic lives in services (exact original code preserved)

const core = require("./services/role-core.service");
const permission = require("./services/role-permission.service");

// Re-export everything exactly as before so all existing routes continue to work
module.exports = {
  // Core role CRUD
  createRole: core.createRole,
  getAllRoles: core.getAllRoles,
  deleteRole: core.deleteRole,
  getRoleById: core.getRoleById,

  // Assignment + permissions
  assignRole: permission.assignRole,
  getRecentRoleToGive: permission.getRecentRoleToGive,
  checkUserRoleStatus: permission.checkUserRoleStatus,
  assignPermissionsToRole: permission.assignPermissionsToRole,
  removePermissionFromRole: permission.removePermissionFromRole,
  getRolePermissions: permission.getRolePermissions,
  updateRolePermissions: permission.updateRolePermissions,
};
