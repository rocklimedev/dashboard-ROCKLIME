const express = require("express");
const router = express.Router();
const {
  getAllCachedPermissions,
  getCachedPermissionByRole,
} = require("./cached-permission.controller");
const { auth } = require("../../middleware/auth");
const { guardModule, clearCacheOnWrite } = require("../../middleware/permission");
router.use(auth);
router.use(guardModule("permissions"));
router.use(clearCacheOnWrite);
router.get("/", getAllCachedPermissions);
router.get("/:roleId", getCachedPermissionByRole);

module.exports = router;
