const express = require("express");
const router = express.Router();
const keywordController = require("../controller/keywordController");
const checkPermission = require("../middleware/permission");
const { auth } = require("../middleware/auth");
router.use(auth);
// Create keyword
router.post(
  "/",
  // checkPermission("write", "create_keyword", "keywords", "/keywords"),
  keywordController.createKeyword,
);

// Get all keywords (with category)
router.get(
  "/",
  // checkPermission("view", "get_all_keywords", "keywords", "/keywords"),
  keywordController.getAllKeywords,
);

// Get keywords by category
router.get(
  "/by-category/:categoryId",
  // checkPermission("view", "get_keywords_by_category", "keywords", "/keywords/by-category/:categoryId"),
  keywordController.getKeywordsByCategoryId,
);

// Get keyword by ID
router.get(
  "/:id",
  // checkPermission("view", "get_keyword_by_id", "keywords", "/keywords/:id"),
  keywordController.getKeywordById,
);

// Update keyword
router.put(
  "/:id",
  // checkPermission("edit", "update_keyword", "keywords", "/keywords/:id"),
  keywordController.updateKeyword,
);

// Delete keyword
router.delete(
  "/:id",
  // checkPermission("delete", "delete_keyword", "keywords", "/keywords/:id"),
  keywordController.deleteKeyword,
);

module.exports = router;
