const express = require("express");
const categoryController = require("../controller/categoryController");
const checkPermission = require("../middleware/permission");

const router = express.Router();

// Create category (expects { name, brandId, parentCategoryId, keywords? })
router.post(
  "/",
  // checkPermission("write", "create_category", "categories", "/category"),
  categoryController.createCategory
);

// All categories (with brand, parent, keywords)
router.get(
  "/all",
  // checkPermission("view", "get_all_categories", "categories", "/category/all"),
  categoryController.getAllCategories
);

// Category by ID
router.get(
  "/:id",
  // checkPermission("view", "get_category_by_id", "categories", "/category/:id"),
  categoryController.getCategoryById
);

// Update category (optionally replace keywords by sending `keywords: []`)
router.put(
  "/:id",
  // checkPermission("edit", "update_category", "categories", "/category/:id"),
  categoryController.updateCategory
);

// Replace only keywords for a category
router.put(
  "/:id/keywords",
  // checkPermission("edit", "replace_keywords", "categories", "/category/:id/keywords"),
  categoryController.replaceCategoryKeywords
);

// List categories for a brand within a given parent-category

// Delete category
router.delete(
  "/:id",
  // checkPermission("delete", "delete_category", "categories", "/category/:id"),
  categoryController.deleteCategory
);

module.exports = router;
