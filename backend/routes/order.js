const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const checkPermission = require("../middleware/permission");
// Route to add a comment to a resource
router.post("/comments", orderController.addComment);

// Route to get comments for a resource
router.get("/comments", orderController.getComments);
router.delete(
  "/comments/:commentId",
  // checkPermission("delete", "delete_comment", "orders", "/orders/comments/:commentId"),
  orderController.deleteComment
);
// Route to delete all comments for a resource
router.post(
  "/delete-comment",

  orderController.deleteCommentsByResource
);
// Create a new order
router.post(
  "/create",
  //checkPermission("write", "create_order", "orders", "/orders/create"),
  orderController.createOrder
);
router.get(
  "/all",
  // checkPermission("view", "get_all_orders", "orders", "/orders/all"),
  orderController.getAllOrders
);
// Get order details by ID
router.get(
  "/:id",
  // checkPermission("view", "get_order_details", "orders", "/orders/:id"),
  orderController.getOrderDetails
);

// Update order status
router.put(
  "/update-status",
  // checkPermission(
  //   "edit",
  //   "updateOrderStatus",
  //   "orders",
  //   "/orders/update-status"
  // ),
  orderController.updateOrderStatus
);

// Delete an order
router.delete(
  "/delete/:id",
  // checkPermission(
  //   "delete",
  //   "delete_order",
  //   "orders",
  //   "/orders/delete/:id"
  // ),
  orderController.deleteOrder
);

// Get recent orders
router.get(
  "/recent",
  // checkPermission("view", "recent_orders", "orders", "/orders/recent"),
  orderController.recentOrders
);

// Update an order by ID
router.put(
  "/:id",
  // checkPermission("edit", "update_order_by_id", "orders", "/orders/:id"),
  orderController.updateOrderById
);

// Create a draft order
router.post(
  "/draft",
  // checkPermission("write", "draft_order", "orders", "/orders/draft"),
  orderController.draftOrder
);
router.get(
  "/filter",
  // checkPermission("view", "get_filtered_orders", "orders", "/orders/filter"),
  orderController.getFilteredOrders
);
router.put(
  "/update-team",
  // checkPermission("edit", "update_order_team", "orders", "/orders/update-team"),
  orderController.updateOrderTeam
);
module.exports = router;
