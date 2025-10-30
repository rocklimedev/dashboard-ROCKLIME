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
// Create a new permission - Only SuperAdmin can create
router.post(
  "/",
  //checkPermission("write", "create_permission", "permissions", "/permissions"),
  createPermission
);

// Get all permissions - Only Admin & SuperAdmin can view
router.get(
  "/",
  // checkPermission("view", "get_all_permission", "permissions", "/permissions"),
  getAllPermissions
);

// edit a permission - Only SuperAdmin can edit
router.put(
  "/:permissionId",
  // checkPermission(
  //   "edit",
  //   "edit_permission",
  //   "permissions",
  //   "/permissions/:permissionId"
  // ),
  editPermission
);

// Delete a permission - Only SuperAdmin can delete
router.delete(
  "/:permissionId",
  // checkPermission(
  //   "delete",
  //   "delete_permission",
  //   "permissions",
  //   "/permissions/:permissionId"
  // ),
  deletePermission
);

router.get(
  "/:permissionId",
  // checkPermission(
  //   "view",
  //   "get_permission",
  //   "permissions",
  //   "/permissions/:permissionId"
  // ),
  getPermission
);

// Assigning permissions to roles

router.post(
  "/assign-permission",
  // checkPermission(
  //   "write",
  //   "assign_permission_to_role",
  //   "permissions",
  //   "/permissions/assign-permission"
  // ),
  assignPermissionToRole
);
router.post(
  "/remove-permission",
  // checkPermission(
  //   "write",
  //   "remove_permission",
  //   "permissions",
  //   "/permissions/remove-permission"
  // ),
  removePermissionFromRole
);
module.exports = router;
