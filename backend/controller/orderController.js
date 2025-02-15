const Order = require("../models/orders");

/**
 * 📌 Create Order
 * @route POST /api/orders/create
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      title,
      pipeline,
      status,
      dueDate,
      assigned,
      followupDates,
      source,
      priority,
      description,
      quotationId,
    } = req.body;

    const order = await Order.create({
      title,
      pipeline,
      status,
      dueDate,
      assigned,
      followupDates,
      source,
      priority,
      description,
      quotationId,
    });

    res.status(201).json({ message: "Order Created Successfully!", order });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ error: error.message });
  }
};
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found!" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found!" });

    order.status = status;
    await order.save();

    res.json({ message: `Order status updated to ${status}`, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found!" });

    await order.destroy();
    res.json({ message: "Order deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
