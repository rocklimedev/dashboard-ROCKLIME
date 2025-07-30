const express = require("express");
const router = express.Router();
const keywordController = require("../controller/keywordController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role");
const { ROLES } = require("../config/constant");

// Create keyword
router.post(
  "/",
  // role.check(ROLES.Admin),
  // checkPermission("write", "create_keyword", "keywords", "/keywords"),
  keywordController.createKeyword
);

// Get all keywords (with category)
router.get(
  "/",
  // role.check(ROLES.Accounts),
  // checkPermission("view", "get_all_keywords", "keywords", "/keywords"),
  keywordController.getAllKeywords
);

// Get keywords by category
router.get(
  "/by-category/:categoryId",
  // role.check(ROLES.Accounts),
  // checkPermission("view", "get_keywords_by_category", "keywords", "/keywords/by-category/:categoryId"),
  keywordController.getKeywordsByCategoryId
);

// Get keyword by ID
router.get(
  "/:id",
  // role.check(ROLES.Accounts),
  // checkPermission("view", "get_keyword_by_id", "keywords", "/keywords/:id"),
  keywordController.getKeywordById
);

// Update keyword
router.put(
  "/:id",
  // role.check(ROLES.Admin),
  // checkPermission("edit", "update_keyword", "keywords", "/keywords/:id"),
  keywordController.updateKeyword
);

// Delete keyword
router.delete(
  "/:id",
  // role.check(ROLES.SuperAdmin),
  // checkPermission("delete", "delete_keyword", "keywords", "/keywords/:id"),
  keywordController.deleteKeyword
);

module.exports = router;
