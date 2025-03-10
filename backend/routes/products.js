const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");

// Product CRUD Routes
router.post("/", productController.createProduct);
router.get("/", productController.getAllProducts);
router.get("/:productId", productController.getProductById);
router.put("/:productId", productController.updateProduct);
router.delete("/:productId", productController.deleteProduct);

// Inventory Management Routes
router.post("/:productId/add-stock", productController.addStock);
router.post("/:productId/remove-stock", productController.removeStock);
router.get("/low-stock", productController.getLowStockProducts);
router.get("/:productId/history", productController.getHistoryByProductId);
module.exports = router;
