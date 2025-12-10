const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const checkPermission = require("../middleware/permission");
const multer = require("multer");
const path = require("path");

// Multer config: accept up to 5 images, max 5MB each
const productUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
}).array("images", 5); // matches FormData key in React

// Helper: safely run multer first, then controller
const withUpload = (handler) => (req, res) => {
  productUpload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image too large. Max 5MB." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ message: "Maximum 5 images allowed." });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    // req.files = array of { buffer, originalname, ... }
    // req.body = parsed form fields (including keywordIds as JSON string or array)
    try {
      await handler(req, res);
    } catch (error) {
      console.error("Controller error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
};

// ==================== PRODUCT CRUD ====================
router.post(
  "/",
  // checkPermission("write", "create_product", "products", "/products"),
  withUpload(productController.createProduct)
);

router.get(
  "/",
  // checkPermission("view", "get_all_products", "products", "/products"),
  productController.getAllProducts
);

router.get("/:productId", productController.getProductById);

router.get("/category/:categoryId", productController.getProductsByCategory);

// THIS IS THE MOST IMPORTANT ONE FOR EDIT MODE
router.put(
  "/:productId",
  // checkPermission("edit", "update_product", "products", "/products/:productId"),
  withUpload(productController.updateProduct)
);

router.post("/by-ids", productController.getProductsByIds);

router.delete("/:productId", productController.deleteProduct);

// ==================== STOCK MANAGEMENT ====================
router.post("/:productId/add-stock", productController.addStock);
router.post("/:productId/remove-stock", productController.removeStock);
router.get("/low-stock", productController.getLowStockProducts);
router.get("/:productId/history", productController.getHistoryByProductId);

// ==================== SEARCH & UTILS ====================
router.get("/search/all", productController.searchProducts);
router.get("/codes/brand-wise", productController.getAllProductCodesBrandWise);
router.get("/search/get-product-codes", productController.getAllProductCodes);
router.get("/check-code", productController.checkproductCode);
router.patch("/:productId/featured", productController.updateProductFeatured);

// ==================== KEYWORDS (CRITICAL FOR YOUR UI) ====================

// 1. Replace ALL keywords (used in your React form → best performance & reliability)
router.put(
  "/:productId/keywords",
  productController.replaceAllKeywordsForProduct
);

// 2. Optional: Add single keyword (not needed if using replaceAll)
router.post("/:productId/keywords", productController.addKeywordsToProduct);

// 3. Remove one keyword
router.delete(
  "/:productId/keywords/:keywordId",
  productController.removeKeywordFromProduct
);

// 4. Remove all (fallback)
router.delete(
  "/:productId/keywords",
  productController.removeAllKeywordsFromProduct
);

module.exports = router;
