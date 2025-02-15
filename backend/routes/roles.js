const express = require("express");
const router = express.Router();
const {
  createRole,
  getAllRoles,
  updateRolePermissions,
  deleteRole,
  assignPermissionsToRole,
} = require("../controller/roleController");

router.post("/", createRole); // Create a new role
router.get("/", getAllRoles); // Get all roles
router.put("/:roleId", updateRolePermissions); // Update role permissions
router.delete("/:roleId", deleteRole); // Delete a role
router.put("/:roleId/permissions", assignPermissionsToRole); // Assign permissions to role

module.exports = router;
