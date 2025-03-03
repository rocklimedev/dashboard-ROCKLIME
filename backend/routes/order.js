const express = require("express");
const orderController = require("../controller/orderController");
const router = express.Router();

// Order Routes
router.post("/order/create", orderController.createOrder);
router.get("/order/:orderId", orderController.getOrderDetails);
router.put("/order/update", orderController.updateOrderStatus);

module.exports = router;
