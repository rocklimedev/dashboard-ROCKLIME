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
  // checkPermission("write", "/permissions"),
  createPermission
);

// Get all permissions - Only Admin & SuperAdmin can view
router.get(
  "/",
  //role.check(ROLES.Admin),
  // checkPermission("view", "/permissions"),
  getAllPermissions
);

// edit a permission - Only SuperAdmin can edit
router.put(
  "/:permissionId",
  // role.check(ROLES.SuperAdmin),
  // checkPermission("edit", "/permissions/:permissionId"),
  editPermission
);

// Delete a permission - Only SuperAdmin can delete
router.delete(
  "/:permissionId",
  //role.check(ROLES.SuperAdmin),
  // checkPermission("delete", "/permissions/:permissionId"),
  deletePermission
);

router.get(
  "/:permissionId",
  // checkPermission("view", "/permissions/:permissionId"),
  getPermission
);
router.get(
  "/",
  //checkPermission("view", "/permissions"),
  getAllPermissions
);

// Assigning permissions to roles

router.post("/assign-permission", assignPermissionToRole);
router.post("/remove-permission", removePermissionFromRole);
module.exports = router;
