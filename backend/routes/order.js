const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");

// Create a new order
router.post("/create", orderController.createOrder);

// Get order details by ID
router.get("/:orderId", orderController.getOrderDetails);

// Update order status
router.put("/update-status", orderController.updateOrderStatus);

// Delete order
router.delete("/:orderId", orderController.deleteOrder);

// Get recent orders
router.get("/recent", orderController.recentOrders);

// Get order by ID
router.get("/order/:orderId", orderController.orderById);

// Update order by ID
router.put("/order/:orderId", orderController.updateOrderById);

// Create draft order
router.post("/draft", orderController.draftOrder);

// Update order team
router.put("/update-team", orderController.updateOrderTeam);

module.exports = router;
