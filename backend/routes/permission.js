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

const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Middleware for RBAC
const { ROLES } = require("../config/constant");

// Create a new permission - Only SuperAdmin can create
router.post(
  "/",
  // role.check(ROLES.SuperAdmin),
  checkPermission("write", "create_permission", "permissions", "/permissions"),
  createPermission
);

// Get all permissions - Only Admin & SuperAdmin can view
router.get(
  "/",
  //role.check(ROLES.Admin),
  checkPermission("view", "get_all_permission", "permissions", "/permissions"),
  getAllPermissions
);

// edit a permission - Only SuperAdmin can edit
router.put(
  "/:permissionId",
  // role.check(ROLES.SuperAdmin),
  checkPermission(
    "edit",
    "edit_permission",
    "permissions",
    "/permissions/:permissionId"
  ),
  editPermission
);

// Delete a permission - Only SuperAdmin can delete
router.delete(
  "/:permissionId",
  //role.check(ROLES.SuperAdmin),
  checkPermission(
    "delete",
    "delete_permission",
    "permissions",
    "/permissions/:permissionId"
  ),
  deletePermission
);

router.get(
  "/:permissionId",
  checkPermission(
    "view",
    "get_permission",
    "permissions",
    "/permissions/:permissionId"
  ),
  getPermission
);

// Assigning permissions to roles

router.post(
  "/assign-permission",
  checkPermission(
    "write",
    "assign_permission_to_role",
    "permissions",
    "/permissions/assign-permission"
  ),
  assignPermissionToRole
);
router.post(
  "/remove-permission",
  checkPermission(
    "write",
    "remove_permission",
    "permissions",
    "/permissions/remove-permission"
  ),
  removePermissionFromRole
);
module.exports = router;
