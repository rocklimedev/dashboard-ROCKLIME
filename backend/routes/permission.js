const express = require("express");
const router = express.Router();

const {
  createPermission,
  getAllPermissions,
  editPermission,
  getPermission,
  deletePermission,
  assignPermissionToRole,
  removePermissionFromRole,
} = require("../controller/permissonController");
const { auth } = require("../middleware/auth");
router.use(auth);
const checkPermission = require("../middleware/permission");

// ==================== PERMISSION CRUD ====================

// Create a new permission - Only SuperAdmin
router.post(
  "/",
  // checkPermission("write", "create_permission", "permissions", "/permissions"),
  createPermission,
);

// Get all permissions - Admin & SuperAdmin
router.get(
  "/",
  // checkPermission("view", "get_all_permission", "permissions", "/permissions"),
  getAllPermissions,
);

// Update a permission - Only SuperAdmin
router.put(
  "/:permissionId",
  // checkPermission("edit", "edit_permission", "permissions", "/permissions/:permissionId"),
  editPermission,
);

// Delete a permission - Only SuperAdmin
router.delete(
  "/:permissionId",
  // checkPermission("delete", "delete_permission", "permissions", "/permissions/:permissionId"),
  deletePermission,
);

// Get single permission by ID
router.get(
  "/:permissionId",
  // checkPermission("view", "get_permission", "permissions", "/permissions/:permissionId"),
  getPermission,
);

// ==================== ROLE-PERMISSION ASSIGNMENT ====================

// Assign permission to a role
router.post(
  "/assign-permission",
  // checkPermission("write", "assign_permission_to_role", "permissions", "/permissions/assign-permission"),
  assignPermissionToRole,
);

// Remove permission from a role
router.post(
  "/remove-permission",
  // checkPermission("write", "remove_permission", "permissions", "/permissions/remove-permission"),
  removePermissionFromRole,
);

module.exports = router;
