const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access middleware
const { ROLES } = require("../config/constant");

// Create a new order - Only Sales, Admin, and SuperAdmin can create
router.post(
  "/create",
  role.check(ROLES.SALES), // Minimum required role: Sales
  checkPermission("write", "/orders"),
  orderController.createOrder
);

// Get order details by ID - Accessible by Accounts, Sales, Admin, and SuperAdmin
router.get(
  "/:orderId",
  role.check(ROLES.Accounts),
  checkPermission("view", "/orders/:orderId"),
  orderController.getOrderDetails
);

// edit order status - Only Admin and SuperAdmin can edit
router.put(
  "/edit-status",
  role.check(ROLES.Admin),
  checkPermission("edit", "/orders/edit-status"),
  orderController.updateOrderStatus
);

// Delete order - Only SuperAdmin can delete
router.delete(
  "/:orderId",
  role.check(ROLES.SuperAdmin),
  checkPermission("delete", "/orders/:orderId"),
  orderController.deleteOrder
);

// Get recent orders - Accessible by Accounts, Sales, Admin, and SuperAdmin
router.get(
  "/recent",
  role.check(ROLES.Accounts),
  checkPermission("view", "/orders/recent"),
  orderController.recentOrders
);

// Get order by ID - Accessible by Accounts, Sales, Admin, and SuperAdmin
router.get(
  "/order/:orderId",
  role.check(ROLES.Accounts),
  checkPermission("view", "/orders/:orderId"),
  orderController.orderById
);

// edit order by ID - Only Admin and SuperAdmin can edit
router.put(
  "/order/:orderId",
  role.check(ROLES.Admin),
  checkPermission("edit", "/orders/:orderId"),
  orderController.updateOrderById
);

// Create draft order - Only Sales and Admin can create
router.post(
  "/draft",
  role.check(ROLES.SALES),
  checkPermission("write", "/orders/draft"),
  orderController.draftOrder
);

// edit order team - Only Admin and SuperAdmin can edit
router.put(
  "/edit-team",
  role.check(ROLES.Admin),
  checkPermission("edit", "/orders/edit-team"),
  orderController.updateOrderTeam
);

module.exports = router;
