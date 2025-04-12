const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");

// Create a new order
router.post("/create", orderController.createOrder);
router.get("/all", orderController.getAllOrders);
// Get order details by ID
router.get("/:id", orderController.getOrderDetails);

// Update order status
router.put("/update-status", orderController.updateOrderStatus);

// Delete an order
router.delete("/delete/:orderId", orderController.deleteOrder);

// Get recent orders
router.get("/recent", orderController.recentOrders);

// Update an order by ID
router.put("/:orderId", orderController.updateOrderById);

// Create a draft order
router.post("/draft", orderController.draftOrder);
router.get("/filter", orderController.getFilteredOrders);
module.exports = router;
