const express = require("express");
const categoryController = require("../controller/categoryController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role");
const { ROLES } = require("../config/constant");

const router = express.Router();

// Create category (expects { name, brandId, parentCategoryId, keywords? })
router.post(
  "/",
  // role.check(ROLES.Admin),
  // checkPermission("write", "create_category", "categories", "/category"),
  categoryController.createCategory
);

// All categories (with brand, parent, keywords)
router.get(
  "/all",
  // role.check(ROLES.Users),
  // checkPermission("view", "get_all_categories", "categories", "/category/all"),
  categoryController.getAllCategories
);

// Category by ID
router.get(
  "/:id",
  // role.check(ROLES.Users),
  // checkPermission("view", "get_category_by_id", "categories", "/category/:id"),
  categoryController.getCategoryById
);

// Update category (optionally replace keywords by sending `keywords: []`)
router.put(
  "/:id",
  // role.check(ROLES.Admin),
  // checkPermission("edit", "update_category", "categories", "/category/:id"),
  categoryController.updateCategory
);

// Replace only keywords for a category
router.put(
  "/:id/keywords",
  // role.check(ROLES.Admin),
  // checkPermission("edit", "replace_keywords", "categories", "/category/:id/keywords"),
  categoryController.replaceCategoryKeywords
);

// List categories for a brand within a given parent-category

// Delete category
router.delete(
  "/:id",
  // role.check(ROLES.SuperAdmin),
  // checkPermission("delete", "delete_category", "categories", "/category/:id"),
  categoryController.deleteCategory
);

module.exports = router;
