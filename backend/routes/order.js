const express = require("express");
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require("../controller/orderController");
const router = express.Router();

router.post("/create", createOrder);
router.get("/all", getAllOrders);
router.get("/:id", getOrderById);
router.put("/update-status/:id", updateOrderStatus);
router.delete("/delete/:id", deleteOrder);
module.exports = router;
