const express = require("express");
const router = express.Router();
const {
  createRole,
  getAllRoles,
  updateRolePermissions,
  deleteRole,
  assignPermissionsToRole,
} = require("../controller/roleController");

const { auth } = require("../middleware/auth"); // Authentication middleware
const checkPermission = require("../middleware/permission"); // Permission middleware
const role = require("../middleware/role"); // Role-based access control (RBAC)
const { ROLES } = require("../config/constant"); // User role constants

// ✅ Create a new role (Only Admins)
router.post(
  "/",
  auth,
  role.check(ROLES.Admin),
  checkPermission("write", "/roles"),
  createRole
);

// ✅ Get all roles (Only Admins & Managers)
router.get(
  "/",
  auth,
  role.check([ROLES.Admin, ROLES.Accounts]),
  checkPermission("view", "/roles"),
  getAllRoles
);

// ✅ edit role permissions (Only Admins)
router.put(
  "/:roleId",
  auth,
  role.check(ROLES.Admin),
  checkPermission("edit", "/roles/:roleId"),
  updateRolePermissions
);

// ✅ Delete a role (Only Admins)
router.delete(
  "/:roleId",
  auth,
  role.check(ROLES.Admin),
  checkPermission("delete", "/roles/:roleId"),
  deleteRole
);

// ✅ Assign permissions to a role (Only Admins)
router.put(
  "/:roleId/permissions",
  auth,
  role.check(ROLES.Admin),
  checkPermission("edit", "/roles/:roleId/permissions"),
  assignPermissionsToRole
);

module.exports = router;
