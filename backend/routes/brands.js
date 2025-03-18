const express = require("express");
const {
  createBrand,
  getBrandById,
  getBrands,
  updateBrand,
  deleteBrand,
} = require("../controller/brandController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access middleware
const { ROLES } = require("../config/constant");

const router = express.Router();

// Only Admin and SuperAdmin can create a brand
router.post(
  "/add",
  role.check(ROLES.Admin), // Only Admin can create brands
  checkPermission("write", "/brands"),
  createBrand
);

// All roles can view brands
router.get(
  "/",
  role.check(ROLES.Users), // Minimum Users role required
  checkPermission("view", "/brands"),
  getBrands
);

// All roles can view a specific brand
router.get(
  "/:id",
  role.check(ROLES.Users),
  checkPermission("view", "/brands/:id"),
  getBrandById
);

// Only Admin and Sales can edit a brand
router.put(
  "/:id",
  role.check(ROLES.Admin), // Only Admin can edit brands
  checkPermission("edit", "/brands/:id"),
  updateBrand
);

// Only SuperAdmin can delete a brand
router.delete(
  "/:id",
  role.check(ROLES.SuperAdmin), // Only SuperAdmin can delete brands
  checkPermission("delete", "/brands/:id"),
  deleteBrand
);

module.exports = router;
