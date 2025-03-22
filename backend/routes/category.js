const express = require("express");
const categoryController = require("../controller/categoryController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access middleware
const { ROLES } = require("../config/constant");

const router = express.Router();

// Only Admin and SuperAdmin can create a category
router.post(
  "/",
  // role.check(ROLES.Admin), // Only Admins can create categories
  // checkPermission("write", "/category"),
  categoryController.createCategory
);

// All users can view categories
router.get(
  "/all",
  // role.check(ROLES.Users), // Minimum role required is Users
  //  checkPermission("view", "/category/all"),
  categoryController.getAllCategories
);

// All users can view a specific category
router.get(
  "/:id",
  //  role.check(ROLES.Users),
  //  checkPermission("view", "/category/:id"),
  categoryController.getCategoryById
);

// Only Admin and Sales can edit a category
router.put(
  "/:id",
  // role.check(ROLES.Admin), // Only Admin can edit categories
  // checkPermission("edit", "/category/:id"),
  categoryController.updateCategory
);

// Only SuperAdmin can delete a category
router.delete(
  "/:id",
  // role.check(ROLES.SuperAdmin), // Only SuperAdmin can delete categories
  //  checkPermission("delete", "/category/:id"),
  categoryController.deleteCategory
);

module.exports = router;
