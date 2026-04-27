const express = require("express");
const router = express.Router();

const bpc = require("../controller/brandParentCategoryController");
const checkPermission = require("../middleware/permission");
const { auth } = require("../middleware/auth");

router.use(auth);

// ---------------------------------------------
// BrandParentCategory (Entity) CRUD
// ---------------------------------------------

// Create a BrandParentCategory
router.post(
  "/",
  // checkPermission("write", "create_brand_parent_category", "brand_parentcategories", "/"),
  bpc.create,
);

// ✅ Update a BrandParentCategory
router.put(
  "/:id",
  // checkPermission("write", "update_brand_parent_category", "brand_parentcategories", "/:id"),
  bpc.update,
);

// List all BrandParentCategories with their attached brands
router.get(
  "/",
  // checkPermission("view", "list_brand_parent_categories", "brand_parentcategories", "/"),
  bpc.list,
);

// Get one BrandParentCategory by ID
router.get(
  "/:id",
  // checkPermission("view", "get_brand_parent_category", "brand_parentcategories", "/:id"),
  bpc.getById,
);

// Delete a BrandParentCategory
router.delete(
  "/:id",
  // checkPermission("delete", "delete_brand_parent_category", "brand_parentcategories", "/:id"),
  bpc.delete,
);

// ---------------------------------------------
// Attach / Detach Brands (M:N Relationship)
// ---------------------------------------------

// Attach one or many brands to a BrandParentCategory
router.post(
  "/:id/brands",
  // checkPermission("write", "attach_brands_to_bpc", "brand_parentcategories", "/:id/brands"),
  bpc.attachBrands,
);

// Detach a single brand from a BrandParentCategory
router.delete(
  "/:id/brands/:brandId",
  // checkPermission("delete", "detach_brand_from_bpc", "brand_parentcategories", "/:id/brands/:brandId"),
  bpc.detachBrand,
);

// ---------------------------------------------
// Tree Structure for a BrandParentCategory
// ---------------------------------------------
router.get(
  "/:id/tree",
  // checkPermission("view", "get_bpc_tree", "brand_parentcategories", "/:id/tree"),
  bpc.getBpcTree,
);

module.exports = router;
