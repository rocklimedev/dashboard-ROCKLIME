const express = require("express");
const router = express.Router();

const bpc = require("../controller/brandParentCategoryController"); // uses the normalized controller
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role");
const { ROLES } = require("../config/constant");

// ---------------------------------------------
// BrandParentCategory (Entity) CRUD
// ---------------------------------------------

// Create a BrandParentCategory (e.g., "CP Fitting", "Wellness")
router.post(
  "/",

  // checkPermission("write", "create_brand_parent_category", "brand_parentcategories", "/"),
  bpc.create
);

// List all BrandParentCategories with their attached brands
router.get(
  "/",

  // checkPermission("view", "list_brand_parent_categories", "brand_parentcategories", "/"),
  bpc.list
);

// Get one BrandParentCategory by id (optional endpoint if you added it)
router.get(
  "/:id",

  // checkPermission("view", "get_brand_parent_category", "brand_parentcategories", "/:id"),
  bpc.getById // <-- implement in controller if you want a simple fetch-by-id
);

// Delete a BrandParentCategory (does not delete brands)
router.delete(
  "/:id",

  // checkPermission("delete", "delete_brand_parent_category", "brand_parentcategories", "/:id"),
  bpc.delete
);

// ---------------------------------------------
// Attach Brands to a BrandParentCategory (M:N via junction)
// ---------------------------------------------

// Attach one or many brands (body: { brandIds: string[] })
router.post(
  "/:id/brands",

  // checkPermission("write", "attach_brands_to_bpc", "brand_parentcategories", "/:id/brands"),
  bpc.attachBrands
);

// (Optional) Detach a single brand from a BPC
router.delete(
  "/:id/brands/:brandId",

  // checkPermission("delete", "detach_brand_from_bpc", "brand_parentcategories", "/:id/brands/:brandId"),
  bpc.detachBrand // <-- implement in controller if you want fine-grained detach
);

// ---------------------------------------------
// Tree for a BrandParentCategory
// ---------------------------------------------
// Returns: BPC -> Brands (M:N) AND ParentCategories (1:M) -> Categories -> Keywords

module.exports = router;
