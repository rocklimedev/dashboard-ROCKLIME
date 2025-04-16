const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const checkPermission = require("../middleware/permission");
// Create a new order
router.post(
  "/create",
  checkPermission("write", "create_order", "orders", "/orders/create"),
  orderController.createOrder
);
router.get(
  "/all",
  checkPermission("view", "get_all_orders", "orders", "/orders/all"),
  orderController.getAllOrders
);
// Get order details by ID
router.get(
  "/:id",
  checkPermission("view", "get_order_details", "orders", "/orders/:id"),
  orderController.getOrderDetails
);

// Update order status
router.put(
  "/update-status",
  checkPermission(
    "edit",
    "updateOrderStatus",
    "orders",
    "/orders/update-status"
  ),
  orderController.updateOrderStatus
);

// Delete an order
router.delete(
  "/delete/:orderId",
  checkPermission(
    "delete",
    "delete_order",
    "orders",
    "/orders/delete/:orderId"
  ),
  orderController.deleteOrder
);

// Get recent orders
router.get(
  "/recent",
  checkPermission("view", "recent_orders", "orders", "/orders/recent"),
  orderController.recentOrders
);

// Update an order by ID
router.put(
  "/:orderId",
  checkPermission("edit", "update_order_by_id", "orders", "/orders/:orderId"),
  orderController.updateOrderById
);

// Create a draft order
router.post(
  "/draft",
  checkPermission("write", "draft_order", "orders", "/orders/draft"),
  orderController.draftOrder
);
router.get(
  "/filter",
  checkPermission("view", "get_filtered_orders", "orders", "/orders/filter"),
  orderController.getFilteredOrders
);
module.exports = router;
