const express = require("express");
const router = express.Router();
const {
  createPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
} = require("../controller/permissonController");

router.post("/", createPermission); // Create permission with methods (POST, GET, PUT, DELETE)
router.get("/", getAllPermissions); // Get all permissions
router.put("/:permissionId", updatePermission); // Update permission (methods)
router.delete("/:permissionId", deletePermission); // Delete permission

module.exports = router;
