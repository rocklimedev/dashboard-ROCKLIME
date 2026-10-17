const express = require("express");
const categoryController = require("./category.controller");
const { auth } = require("../../middleware/auth");
const { guardModule } = require("../../middleware/permission");
const router = express.Router();

router.use(auth);
router.use(guardModule("categories"));
// Create category (expects { name, brandId, parentCategoryId, keywords? })
router.post(
  "/",
  categoryController.createCategory,
);
// GET all categories for a brand
router.get("/by-brand/:brandId", categoryController.getAllCategoriesByBrand);

// All categories (with brand, parent, keywords)
router.get(
  "/all",
  categoryController.getAllCategories,
);

// Category by ID
router.get(
  "/:id",
  categoryController.getCategoryById,
);

// Update category (optionally replace keywords by sending `keywords: []`)
router.put(
  "/:id",
  categoryController.updateCategory,
);

// Replace only keywords for a category
router.put(
  "/:id/keywords",
  categoryController.replaceCategoryKeywords,
);

// List categories for a brand within a given parent-category

// Delete category
router.delete(
  "/:id",
  categoryController.deleteCategory,
);

module.exports = router;
