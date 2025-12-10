const express = require("express");
const router = express.Router();
const {
  getAllCachedPermissions,
  getCachedPermissionByRole,
} = require("../controller/cachedPermissionController");

router.get("/", getAllCachedPermissions);
router.get("/:roleId", getCachedPermissionByRole);

module.exports = router;
