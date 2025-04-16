// routes/rolePermission.js
const express = require("express");
const router = express.Router();
const {
  assignPermissionToRole,
  removePermissionFromRole,
  getAllRolePermissionsByRoleId,
  getRolePermissionByRoleIdAndPermissionId,
  getAllRolePermissions,
} = require("../controller/rolePermissionController");
const checkPermission = require("../middleware/permission");
router.post(
  "/assign-permission",
  checkPermission(
    "write",
    "assign_permission_to_role",
    "rolepermissions",
    "/role-permissions/assign-permission"
  ),
  assignPermissionToRole
);
router.post(
  "/remove-permission",
  checkPermission(
    "write",
    "remove_permission_from_role",
    "rolepermissions",
    "/role-permissions/remove-permission"
  ),
  removePermissionFromRole
);
router.get(
  "/:roleId/permissions",
  checkPermission(
    "view",
    "get_all_role_permissions_by_roleId",
    "rolepermissions",
    "/role-permissions/:roleId/permissions"
  ),
  getAllRolePermissionsByRoleId
);
router.get(
  "/:roleId/permission/:permissionId",
  checkPermission(
    "view",
    "get_rolepermission_by_roleId_and_permissionId",
    "rolepermissions",
    "/role-permissions/:roleId/permission/:permissionId"
  ),
  getRolePermissionByRoleIdAndPermissionId
);
router.get(
  "/",
  checkPermission(
    "view",
    "get_all_role_permissions",
    "role_permissions",
    "/role-permissions/"
  ),
  getAllRolePermissions
);

module.exports = router;
