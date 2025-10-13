// routes/purchaseOrderRoutes.js
const express = require("express");
const router = express.Router();
const purchaseOrderController = require("../controller/purchaseOrderController");

// Create a new purchase order
router.post("/", purchaseOrderController.createPurchaseOrder);

// Get all purchase orders
router.get("/", purchaseOrderController.getAllPurchaseOrders);

// Get a purchase order by ID
router.get("/:id", purchaseOrderController.getPurchaseOrderById);

// Update a purchase order
router.put("/:id", purchaseOrderController.updatePurchaseOrder);

// Delete a purchase order
router.delete("/:id", purchaseOrderController.deletePurchaseOrder);

// Confirm a purchase order and update stock
router.put("/:id/confirm", purchaseOrderController.confirmPurchaseOrder);

// Get purchase orders by vendor
router.get(
  "/vendor/:vendorId",
  purchaseOrderController.getPurchaseOrdersByVendor
);
// ✅ New route to update purchase order status
router.patch("/:id/status", purchaseOrderController.updatePurchaseOrderStatus);
module.exports = router;
