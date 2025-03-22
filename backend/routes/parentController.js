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
  // checkPermission("write", "/parent-categories"),
  parentCategoryController.createParentCategory
);

// Get all parent categories - Accessible by Sales, Admin, and SuperAdmin
router.get(
  "/",
  // role.check(ROLES.SALES),
  // checkPermission("view", "/parent-categories"),
  parentCategoryController.getAllParentCategories
);

// Get a parent category by ID - Accessible by Sales, Admin, and SuperAdmin
router.get(
  "/:id",
  // role.check(ROLES.SALES),
  // checkPermission("view", "/parent-categories/:id"),
  parentCategoryController.getParentCategoryById
);

// edit a parent category - Only Admin and SuperAdmin can edit
router.put(
  "/:id",
  // role.check(ROLES.Admin),
  //  checkPermission("edit", "/parent-categories/:id"),
  parentCategoryController.updateParentCategory
);

// Delete a parent category - Only SuperAdmin can delete
router.delete(
  "/:id",
  // role.check(ROLES.SuperAdmin),
  // checkPermission("delete", "/parent-categories/:id"),
  parentCategoryController.deleteParentCategory
);

module.exports = router;
