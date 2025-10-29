const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role");
const { ROLES } = require("../config/constant");

// ✅ Product CRUD Routes
router.post(
  "/",
  //role.check(ROLES.Admin), // Only Admins can create products
  //checkPermission("write", "create_product", "products", "/products"),
  productController.createProduct
);

router.get(
  "/",
  //  checkPermission("view", "get_all_products", "products", "/products"),
  productController.getAllProducts
);

router.get(
  "/:productId",
  // checkPermission(
  //   "view",
  //   "get_product_by_id",
  //   "products",
  //   "/products/:productId"
  // ),
  productController.getProductById
);
router.get(
  "/category/:categoryId",
  // role.check(ROLES.Admin),
  // checkPermission(
  //   "view",
  //   "view_product_by_category",
  //   "products",
  //   "/products/category/:categoryId"
  // ),
  productController.getProductsByCategory
);
router.put(
  "/:productId",
  //role.check(ROLES.Admin), // Only Admins can edit products
  // checkPermission("edit", "update_product", "products", "/products/:productId"),
  productController.updateProduct
);
router.post("/by-ids", productController.getProductsByIds);
router.delete(
  "/:productId",
  // role.check(ROLES.Admin), // Only Admins can delete products
  // checkPermission(
  //   "delete",
  //   "delete_product",
  //   "products",
  //   "/products/:productId"
  // ),
  productController.deleteProduct
);

// ✅ Inventory Management Routes
router.post(
  "/:productId/add-stock",
  // role.check(ROLES.Admin), // Only Admins can modify stock
  // checkPermission(
  //   "edit",
  //   "add_stock",
  //   "products",
  //   "/products/:productId/add-stock"
  // ),
  productController.addStock
);

router.post(
  "/:productId/remove-stock",
  //  role.check(ROLES.Admin), // Only Admins can modify stock
  // checkPermission(
  //   "edit",
  //   "remove_stock",
  //   "products",
  //   "/products/:productId/remove-stock"
  // ),
  productController.removeStock
);

router.get(
  "/low-stock",
  // checkPermission(
  //   "view",
  //   "get_low_stock_products",
  //   "products",
  //   "/products/low-stock"
  // ),
  productController.getLowStockProducts
);

router.get(
  "/:productId/history",
  // checkPermission(
  //   "view",
  //   "get_history_by_product_id",
  //   "products",
  //   "/products/:productId/history"
  // ),
  productController.getHistoryByProductId
);

router.get(
  "/search/all",
  //  checkPermission("view", "search_products", "products", "/products/search"),
  productController.searchProducts
);
router.get("/codes/brand-wise", productController.getAllProductCodesBrandWise);
// ✅ Unique Route for Product Codes
// This will ensure that it is not mistaken for a product ID route
router.get("/search/get-product-codes", productController.getAllProductCodes);
router.patch("/:productId/featured", productController.updateProductFeatured);
module.exports = router;
