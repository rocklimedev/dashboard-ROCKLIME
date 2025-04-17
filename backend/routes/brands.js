const express = require("express");
const {
  createBrand,
  getBrandById,
  getBrands,
  updateBrand,
  deleteBrand,
  getTotalProductOfBrand,
} = require("../controller/brandController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access middleware
const { ROLES } = require("../config/constant");

const router = express.Router();

// Only Admin and SuperAdmin can create a brand
router.post(
  "/add",
  // role.check(ROLES.Admin), // Only Admin can create brands
  // checkPermission("write", "create_brand", "brands", "/brands/add"),
  createBrand
);

// All roles can view brands
router.get(
  "/",
  //  role.check(ROLES.Users), // Minimum Users role required
  // checkPermission("view", "view_brand", "brands", "/brands"),
  getBrands
);

// All roles can view a specific brand
router.get(
  "/:id",
  // role.check(ROLES.Users),
  // checkPermission("view", "view_brand", "brands", "/brands/:id"),
  getBrandById
);

// Only Admin and Sales can edit a brand
router.put(
  "/:id",
  // role.check(ROLES.Admin), // Only Admin can edit brands
  //checkPermission("edit", "edit_brand", "brands", "/brands/:id"),
  updateBrand
);

// Only SuperAdmin can delete a brand
router.delete(
  "/:id",
  // role.check(ROLES.SuperAdmin), // Only SuperAdmin can delete brands
  // checkPermission("delete", "delete_brand", "brands", "/brands/:id"),
  deleteBrand
);
router.get(
  "/:brandId/total-products",
  // checkPermission(
  //   "view",
  //   "get_total_products_of_this_brand",
  //   "brands",
  //   "/brands/total-products"
  // ),
  getTotalProductOfBrand
);
module.exports = router;
