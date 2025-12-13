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

// ✅ Create a new role (Only Admins)
router.post(
  "/",
  auth,
  // checkPermission("write", "create_role", "roles", "/roles"),
  createRole
);

// ✅ Get all roles (Only Admins & Managers)
router.get(
  "/",

  //  checkPermission("view", "get_all_roles", "roles", "/roles"),
  getAllRoles
);

// ✅ edit role permissions (Only Admins)
router.put(
  "/:roleId",
  auth,
  // checkPermission("edit", "update_role_permissions", "roles", "/roles/:roleId"),
  updateRolePermissions
);

// ✅ Delete a role (Only Admins)
router.delete(
  "/:roleId",
  auth,
  // checkPermission("delete", "delete_role", "roles", "/roles/:roleId"),
  deleteRole
);

// ✅ Assign permissions to a role (Only Admins)
router.post(
  "/:roleId/permissions",
  auth,
  // checkPermission(
  //   "edit",
  //   "assign_permissions_to_role",
  //   "roles",
  //   "/roles/:roleId/permissions"
  // ),
  assignPermissionsToRole
);
router.delete(
  "/:roleId/permissions",
  auth,
  // checkPermission(
  //   "delete",
  //   "remove_permission_from_role",
  //   "roles",
  //   "/roles/:roleId/permissions"
  // ),
  removePermissionFromRole
);
router.post(
  "/assign-role",
  // checkPermission("write", "assign_role", "roles", "/roles/assign-role"),
  assignRole
);
router.get(
  "/:roleId",
  // checkPermission("view", "get_role_by_id", "roles", "/roles/:roleId"),
  getRoleById
);
router.get(
  "/:roleId",
  //checkPermission("view", "get_role_permissions", "roles", "/roles/:roleId"),
  getRolePermissions
);
router.get(
  "/recent",
  // checkPermission("view", "get_recent_role_to_give", "roles", "/roles/recent"),
  getRecentRoleToGive
);
module.exports = router;
