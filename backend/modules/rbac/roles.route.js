const express = require('express');
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
} = require('./role.controller');

const { auth } = require('../../middleware/auth'); // Authentication middleware
const { guardModule, clearCacheOnWrite } = require('../../middleware/permission');

router.use(auth);
router.use(guardModule('roles'), clearCacheOnWrite);

// Fixed paths before "/:roleId"
router.get('/', getAllRoles);
router.post('/', createRole);
router.get('/recent', getRecentRoleToGive);
router.post('/assign-role', assignRole);
router.get('/:roleId', getRoleById);
router.get('/:roleId/permissions', getRolePermissions);
router.put('/:roleId', updateRolePermissions);
router.delete('/:roleId', deleteRole);
router.post('/:roleId/permissions', assignPermissionsToRole);
router.delete('/:roleId/permissions', removePermissionFromRole);

module.exports = router;
