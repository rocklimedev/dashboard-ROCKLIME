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
const router = express.Router();

// Only Admin and SuperAdmin can create a brand
router.post(
  "/add",
  // checkPermission("write", "create_brand", "brands", "/brands/add"),
  createBrand
);

// All roles can view brands
router.get(
  "/",
  // checkPermission("view", "view_brand", "brands", "/brands"),
  getBrands
);

// All roles can view a specific brand
router.get(
  "/:id",
  // checkPermission("view", "view_brand", "brands", "/brands/:id"),
  getBrandById
);

// Only Admin and Sales can edit a brand
router.put(
  "/:id",
  //checkPermission("edit", "edit_brand", "brands", "/brands/:id"),
  updateBrand
);

// Only SuperAdmin can delete a brand
router.delete(
  "/:id",
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
