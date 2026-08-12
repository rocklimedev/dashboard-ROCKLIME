const express = require("express");
const router = express.Router();
const {
  getAllCachedPermissions,
  getCachedPermissionByRole,
} = require("./cached-permission.controller");
const { auth } = require("../../middleware/auth");
router.use(auth);
router.get("/", getAllCachedPermissions);
router.get("/:roleId", getCachedPermissionByRole);

module.exports = router;
