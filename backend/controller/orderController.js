const Order = require("../models/orders");
const OrderItem = require("../models/orderItem");
const Cart = require("../routes/cart");
exports.createOrder = async (req, res) => {
  try {
    const { userId, quotationId, title } = req.body;
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Create Order in MySQL
    const order = await Order.create({
      title,
      quotationId,
      status: "CREATED",
    });

    // Store Order Items in MongoDB
    await OrderItem.create({
      orderId: order.id,
      items: cart.items,
    });

    // Clear Cart
    await Cart.deleteOne({ userId });

    res.status(201).json({ message: "Order created", orderId: order.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const orderItems = await OrderItem.findOne({ orderId });

    res.status(200).json({ order, items: orderItems?.items || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findByPk(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
