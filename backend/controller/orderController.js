const Order = require("../models/orders");
const OrderItem = require("../models/orderItem");
const Team = require("../models/team");
// Ensure Team and Order models are imported
const Quotation = require("../models/quotation");
exports.createOrder = async (req, res) => {
  try {
    const {
      title,
      createdFor,
      createdBy,
      pipeline,
      status,
      dueDate,
      assignedTo,
      followupDates,
      source,
      priority,
      description,
      quotationId,
      teamId,
    } = req.body;

    console.log("Received data:", req.body);

    // Validate required fields
    if (!title || !quotationId || !createdFor || !createdBy || !teamId) {
      return res.status(400).json({
        message:
          "Title, quotationId, createdFor, createdBy, and teamId are required",
      });
    }

    // Check if quotationId exists (if it's a foreign key)
    const quotationExists = await Quotation.findByPk(quotationId);
    if (!quotationExists) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Ensure followupDates is properly formatted (if needed)
    const parsedFollowupDates = Array.isArray(followupDates)
      ? followupDates
      : [];

    // Create the order
    const order = await Order.create({
      title,
      createdFor,
      createdBy,
      pipeline,
      status: status || "CREATED", // Default status
      dueDate,
      assignedTo,
      followupDates: parsedFollowupDates,
      source,
      priority,
      description,
      quotationId,
      teamId,
    });

    console.log("Order created:", order);

    res.status(201).json({
      message: "Order created successfully",
      orderId: order.id,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({
      error: "Something went wrong while creating the order",
    });
  }
};
exports.getAllOrders = async (req, res) => {
  try {
    console.log("Fetching orders...");
    const orders = await Order.findAll();

    console.log("Orders fetched:", orders.length); // Log the count
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json({ orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ order });
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

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    await OrderItem.destroy({ where: { orderId } });
    await order.destroy();

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recentOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
      limit: 20,
    });
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.orderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.update(updates);

    res.status(200).json({ message: "Order updated successfully", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.draftOrder = async (req, res) => {
  try {
    const { title, quotationId, teamId } = req.body;
    if (!teamId) return res.status(400).json({ message: "teamId is required" });

    const order = await Order.create({
      title,
      quotationId,
      status: "DRAFT",
      teamId,
    });

    res.status(201).json({ message: "Draft order created", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
