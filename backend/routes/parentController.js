const express = require("express");
const router = express.Router();
const parentCategoryController = require("../controller/parentCategoryController");
const checkPermission = require("../middleware/permission");

// Create a parent category - Only Admin and SuperAdmin can create
router.post(
  "/",
  // checkPermission(
  //   "write",
  //   "create_parent_category",
  //   "parentcategories",
  //   "/parent-categories"
  // ),
  parentCategoryController.createParentCategory
);

// Get all parent categories - Accessible by Sales, Admin, and SuperAdmin
router.get(
  "/",
  // checkPermission(
  //   "view",
  //   "get_all_parent_categories",
  //   "parentcategories",
  //   "/parent-categories"
  // ),
  parentCategoryController.getAllParentCategories
);

// Get a parent category by ID - Accessible by Sales, Admin, and SuperAdmin
router.get(
  "/:id",
  // checkPermission(
  //   "view",
  //   "get_parent_category_by_id",
  //   "parentcategories",
  //   "/parent-categories/:id"
  // ),
  parentCategoryController.getParentCategoryById
);

// edit a parent category - Only Admin and SuperAdmin can edit
router.put(
  "/:id",
  // checkPermission(
  //   "edit",
  //   "update_parent_category",
  //   "parentcategories",
  //   "/parent-categories/:id"
  // ),
  parentCategoryController.updateParentCategory
);

// Delete a parent category - Only SuperAdmin can delete
router.delete(
  "/:id",
  // checkPermission(
  //   "delete",
  //   "delete_parent_category",
  //   "parentcategories",
  //   "/parent-categories/:id"
  // ),
  parentCategoryController.deleteParentCategory
);

// ...
router.get(
  "/:id/with-brands",
  // checkPermission("view", "get_parent_category_with_brands", "parentcategories", "/parent-categories/:id/with-brands"),
  parentCategoryController.getParentCategoryWithBrandsAndCounts
);

module.exports = router;
