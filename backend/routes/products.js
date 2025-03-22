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
  // checkPermission("write", "/products"),
  productController.createProduct
);

router.get(
  "/",
  // checkPermission("view", "/products"),
  productController.getAllProducts
);

router.get(
  "/:productId",
  // checkPermission("view", "/products/:productId"),
  productController.getProductById
);

router.put(
  "/:productId",
  //role.check(ROLES.Admin), // Only Admins can edit products
  // checkPermission("edit", "/products/:productId"),
  productController.updateProduct
);

router.delete(
  "/:productId",
  // role.check(ROLES.Admin), // Only Admins can delete products
  // checkPermission("delete", "/products/:productId"),
  productController.deleteProduct
);

// ✅ Inventory Management Routes
router.post(
  "/:productId/add-stock",
  // role.check(ROLES.Admin), // Only Admins can modify stock
  // checkPermission("edit", "/products/:productId/add-stock"),
  productController.addStock
);

router.post(
  "/:productId/remove-stock",
  //  role.check(ROLES.Admin), // Only Admins can modify stock
  // checkPermission("edit", "/products/:productId/remove-stock"),
  productController.removeStock
);

router.get(
  "/low-stock",
  // checkPermission("view", "/products/low-stock"),
  productController.getLowStockProducts
);

router.get(
  "/:productId/history",
  // checkPermission("view", "/products/:productId/history"),
  productController.getHistoryByProductId
);

module.exports = router;
