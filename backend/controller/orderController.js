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
      invoiceId,
    } = req.body;

    // Required fields validation
    if (!title || !invoiceId || !createdFor || !createdBy) {
      return res.status(400).json({
        message: "Title, invoiceId, createdFor, and createdBy are required",
      });
    }

    // Parse followupDates safely
    const parsedFollowupDates = Array.isArray(followupDates)
      ? followupDates
      : [];

    // Normalize assignedTo
    const assignedTeamId = assignedTo?.trim?.() === "" ? null : assignedTo;

    // Debug log (optional)
    console.log(
      "assignedTo received:",
      assignedTo,
      "| Parsed:",
      assignedTeamId
    );

    // Check if assignedTo team exists
    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return res.status(400).json({ error: "Assigned team not found." });
      }
    }

    // Create the order
    const order = await Order.create({
      title,
      createdFor,
      createdBy,
      pipeline,
      status: status || "CREATED",
      dueDate,
      assignedTo: assignedTeamId,
      followupDates: parsedFollowupDates,
      source,
      priority,
      description,
      invoiceId,
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
      details: err.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll();

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
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order)
      return res.status(404).json({ message: `Order with ID ${id} not found` });

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
// controllers/order.controller.js

exports.getFilteredOrders = async (req, res) => {
  try {
    const {
      status,
      priority,
      dueDate,
      createdBy,
      assignedTo,
      createdFor,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (dueDate) {
      filters.dueDate = {
        [Op.eq]: dueDate, // or Op.lte if you're filtering before or on dueDate
      };
    }
    if (createdBy) filters.createdBy = createdBy;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (createdFor) filters.createdFor = createdFor;

    const offset = (page - 1) * limit;

    // Fetch orders with pagination
    const orders = await Order.findAll({
      where: filters,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    // Get the total count of matching orders
    const totalCount = await Order.count({
      where: filters,
    });

    return res.status(200).json({
      orders,
      totalCount, // Return the total count of orders for pagination
    });
  } catch (err) {
    console.error("Filter Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
