const express = require("express");
const router = express.Router();
const parentCategoryController = require("../controller/parentCategoryController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access middleware
const { ROLES } = require("../config/constant");

// Create a parent category - Only Admin and SuperAdmin can create
router.post(
  "/",
  // role.check(ROLES.Admin),
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
  // role.check(ROLES.SALES),
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
  // role.check(ROLES.SALES),
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
  // role.check(ROLES.Admin),
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
  // role.check(ROLES.SuperAdmin),
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
  // role.check(ROLES.SALES),
  // checkPermission("view", "get_parent_category_with_brands", "parentcategories", "/parent-categories/:id/with-brands"),
  parentCategoryController.getParentCategoryWithBrandsAndCounts
);

module.exports = router;
