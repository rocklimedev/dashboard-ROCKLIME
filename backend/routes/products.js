const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const checkPermission = require("../middleware/permission");
const multer = require("multer");
const path = require("path");

const productUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
}).array("images", 5); // field name used by the React form

// ---------------------------------------------------------------
// 2. Helper – call Multer *inside* the controller (same pattern as invoice)
// ---------------------------------------------------------------
const withUpload = (handler) => (req, res) => {
  productUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    // files are now in req.files (array of buffers)
    handler(req, res);
  });
};
// ✅ Product CRUD Routes
router.post(
  "/",
  //checkPermission("write", "create_product", "products", "/products"),
  withUpload(productController.createProduct) // <-- NEW
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
  // checkPermission("edit", "update_product", "products", "/products/:productId"),
  withUpload(productController.updateProduct) // <-- NEW
);
router.post("/by-ids", productController.getProductsByIds);
router.delete(
  "/:productId",
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
