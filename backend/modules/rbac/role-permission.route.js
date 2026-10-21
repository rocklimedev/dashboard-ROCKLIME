// routes/rolePermission.js
const express = require('express');
const router = express.Router();
const {
  assignPermissionToRole,
  removePermissionFromRole,
  getAllRolePermissionsByRoleId,
  getRolePermissionByRoleIdAndPermissionId,
  getAllRolePermissions,
} = require('./role-permission.controller');
const { auth } = require('../../middleware/auth');
const { guardModule, clearCacheOnWrite } = require('../../middleware/permission');
router.use(auth);
router.use(guardModule('permissions'));
router.use(clearCacheOnWrite);
router.post('/assign-permission', assignPermissionToRole);
router.post('/remove-permission', removePermissionFromRole);
router.get('/:roleId/permissions', getAllRolePermissionsByRoleId);
router.get('/:roleId/permission/:permissionId', getRolePermissionByRoleIdAndPermissionId);
router.get('/', getAllRolePermissions);

module.exports = router;
