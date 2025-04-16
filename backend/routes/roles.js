const express = require("express");
const router = express.Router();
const {
  createRole,
  getAllRoles,
  updateRolePermissions,
  deleteRole,
  assignPermissionsToRole,
  assignRole,
  getRoleById,
  removePermissionFromRole,
  getRolePermissions,
  getRecentRoleToGive,
} = require("../controller/roleController");

const { auth } = require("../middleware/auth"); // Authentication middleware
const checkPermission = require("../middleware/permission"); // Permission middleware
const role = require("../middleware/role"); // Role-based access control (RBAC)
const { ROLES } = require("../config/constant"); // User role constants

// ✅ Create a new role (Only Admins)
router.post(
  "/",
  auth,
  // role.check(ROLES.Admin),
  checkPermission("write", "create_role", "roles", "/roles"),
  createRole
);

// ✅ Get all roles (Only Admins & Managers)
router.get(
  "/",
  auth,
  // role.check([ROLES.Admin, ROLES.Accounts]),
  checkPermission("view", "get_all_roles", "roles", "/roles"),
  getAllRoles
);

// ✅ edit role permissions (Only Admins)
router.put(
  "/:roleId",
  auth,
  //  role.check(ROLES.Admin),
  checkPermission("edit", "update_role_permissions", "roles", "/roles/:roleId"),
  updateRolePermissions
);

// ✅ Delete a role (Only Admins)
router.delete(
  "/:roleId",
  auth,
  // role.check(ROLES.Admin),
  checkPermission("delete", "delete_role", "roles", "/roles/:roleId"),
  deleteRole
);

// ✅ Assign permissions to a role (Only Admins)
router.post(
  "/:roleId/permissions",
  auth,
  // role.check(ROLES.Admin),
  checkPermission(
    "edit",
    "assign_permissions_to_role",
    "roles",
    "/roles/:roleId/permissions"
  ),
  assignPermissionsToRole
);
router.delete(
  "/:roleId/permissions",
  auth,
  // role.check(ROLES.Admin),
  checkPermission(
    "delete",
    "remove_permission_from_role",
    "roles",
    "/roles/:roleId/permissions"
  ),
  removePermissionFromRole
);
router.post(
  "/assign-role",
  checkPermission("write", "assign_role", "roles", "/roles/assign-role"),
  assignRole
);
router.get(
  "/:roleId",
  checkPermission("view", "get_role_by_id", "roles", "/roles/:roleId"),
  getRoleById
);
router.get(
  "/:roleId",
  checkPermission("view", "get_role_permissions", "roles", "/roles/:roleId"),
  getRolePermissions
);
router.get(
  "/recent",
  checkPermission("view", "get_recent_role_to_give", "roles", "/roles/recent"),
  getRecentRoleToGive
);
module.exports = router;
