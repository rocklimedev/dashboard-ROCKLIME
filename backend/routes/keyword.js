const express = require("express");
const router = express.Router();
const keywordController = require("../controller/keywordController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access middleware
const { ROLES } = require("../config/constant");

// Create keyword - Only Admin and SuperAdmin can create
router.post(
  "/",
  // role.check(ROLES.Admin), // Only Admin and SuperAdmin can create
  //checkPermission("write", "/keywords"),
  keywordController.createKeyword
);

// Get all keywords - Accessible by Accounts, Sales, Admin, and SuperAdmin
router.get(
  "/",
  // role.check(ROLES.Accounts), // Minimum role required is Accounts
  // checkPermission("view", "/keywords"),
  keywordController.getAllKeywords
);

// Get keyword by ID - Accessible by Accounts, Sales, Admin, and SuperAdmin
router.get(
  "/:id",
  //  role.check(ROLES.Accounts),
  // checkPermission("view", "/keywords/:id"),
  keywordController.getKeywordById
);

// edit keyword - Only Admin and SuperAdmin can edit
router.put(
  "/:id",
  //  role.check(ROLES.Admin),
  //  checkPermission("edit", "/keywords/:id"),
  keywordController.updateKeyword
);

// Delete keyword - Only SuperAdmin can delete
router.delete(
  "/:id",
  //role.check(ROLES.SuperAdmin),
  //checkPermission("delete", "/keywords/:id"),
  keywordController.deleteKeyword
);

module.exports = router;
