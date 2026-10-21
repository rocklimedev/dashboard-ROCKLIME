const express = require('express');
const router = express.Router();

const {
  createPermission,
  getAllPermissions,
  editPermission,
  getPermission,
  deletePermission,
  assignPermissionToRole,
  removePermissionFromRole,
} = require('./permisson.controller');
const { auth } = require('../../middleware/auth');
const { guardModule, clearCacheOnWrite } = require('../../middleware/permission');
router.use(auth);
router.use(guardModule('permissions'));
router.use(clearCacheOnWrite);

// ==================== PERMISSION CRUD ====================

// Create a new permission - Only SuperAdmin
router.post('/', createPermission);

// Get all permissions - Admin & SuperAdmin
router.get('/', getAllPermissions);

// Update a permission - Only SuperAdmin
router.put('/:permissionId', editPermission);

// Delete a permission - Only SuperAdmin
router.delete('/:permissionId', deletePermission);

// Get single permission by ID
router.get('/:permissionId', getPermission);

// ==================== ROLE-PERMISSION ASSIGNMENT ====================

// Assign permission to a role
router.post('/assign-permission', assignPermissionToRole);

// Remove permission from a role
router.post('/remove-permission', removePermissionFromRole);

module.exports = router;
