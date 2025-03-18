const express = require("express");
const router = express.Router();
const {
  createPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
} = require("../controller/permissonController");

const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Middleware for RBAC
const { ROLES } = require("../config/constant");

// Create a new permission - Only SuperAdmin can create
router.post(
  "/",
  role.check(ROLES.SuperAdmin),
  checkPermission("write", "/permissions"),
  createPermission
);

// Get all permissions - Only Admin & SuperAdmin can view
router.get(
  "/",
  role.check(ROLES.Admin),
  checkPermission("view", "/permissions"),
  getAllPermissions
);

// edit a permission - Only SuperAdmin can edit
router.put(
  "/:permissionId",
  role.check(ROLES.SuperAdmin),
  checkPermission("edit", "/permissions/:permissionId"),
  updatePermission
);

// Delete a permission - Only SuperAdmin can delete
router.delete(
  "/:permissionId",
  role.check(ROLES.SuperAdmin),
  checkPermission("delete", "/permissions/:permissionId"),
  deletePermission
);

module.exports = router;
