const Order = require("../models/orders");
const OrderItem = require("../models/orderItem");
const Team = require("../models/team");
// Ensure Team and Order models are imported
const Invoice = require("../models/invoice");
const { Op } = require("sequelize");

const Customer = require("../models/customers"); // Import Customer model
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
      orderNo,
    } = req.body;

    // Required fields validation
    if (!title || !invoiceId || !createdFor || !createdBy) {
      return res.status(400).json({
        message: "Title, invoiceId, createdFor, and createdBy are required",
      });
    }

    // Validate invoiceId
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(400).json({ message: "Invalid or missing invoiceId" });
    }

    // Validate dueDate
    if (dueDate && new Date(dueDate).toString() === "Invalid Date") {
      return res.status(400).json({ message: "Invalid dueDate format" });
    }

    // Parse and validate followupDates
    const parsedFollowupDates = Array.isArray(followupDates)
      ? followupDates.filter(
          (date) => date && new Date(date).toString() !== "Invalid Date"
        )
      : [];

    // Normalize and validate assignedTo
    const assignedTeamId = assignedTo?.trim?.() === "" ? null : assignedTo;
    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return res.status(400).json({ message: "Assigned team not found" });
      }
    }

    // Validate orderNo if provided
    if (orderNo && isNaN(parseInt(orderNo))) {
      return res
        .status(400)
        .json({ message: "orderNo must be a valid number" });
    }
    if (orderNo) {
      const existingOrder = await Order.findOne({
        where: { orderNo: parseInt(orderNo) },
      });
      if (existingOrder) {
        return res.status(400).json({ message: "Order number already exists" });
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
      orderNo: orderNo ? parseInt(orderNo) : null,
    });

    res.status(201).json({
      message: "Order created successfully",
      id: order.id,
    });
  } catch (err) {
    console.error("Create order error:", err.message, err.stack);
    res.status(500).json({
      message: "Something went wrong while creating the order",
      details: err.message,
    });
  }
};
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.status(200).json({ orders, totalCount: orders.length });
  } catch (err) {
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
    const { id, status } = req.body;
    const order = await Order.findByPk(id);

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
    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    await OrderItem.deleteOne({ orderId: id });
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
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const order = await Order.findByPk(id);
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

exports.getFilteredOrders = async (req, res) => {
  try {
    const {
      status,
      priority,
      dueDate,
      createdBy,
      assignedTo,
      createdFor,
      important,
      trash,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate query parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Invalid page number" });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: "Invalid limit (must be 1-100)" });
    }

    const filters = {};

    // Normalize and validate filters
    if (status) {
      const normalizedStatus = status.toUpperCase();
      const validStatuses = [
        "CREATED",
        "PREPARING",
        "CHECKING",
        "INVOICE",
        "DISPATCHED",
        "DELIVERED",
        "PARTIALLY_DELIVERED",
        "CANCELED",
        "DRAFT",
        "ONHOLD",
      ];
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      filters.status = normalizedStatus;
    }

    if (priority) {
      const normalizedPriority = priority.toLowerCase();
      const validPriorities = ["high", "medium", "low"];
      if (!validPriorities.includes(normalizedPriority)) {
        return res.status(400).json({ error: "Invalid priority value" });
      }
      filters.priority = normalizedPriority;
    }

    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate)) {
        return res.status(400).json({ error: "Invalid dueDate format" });
      }
      filters.dueDate = { [Op.lte]: parsedDate };
    }

    if (createdBy) filters.createdBy = createdBy;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (createdFor) filters.createdFor = createdFor;

    if (important !== undefined) {
      filters.important = important === "true" || important === true;
    }
    if (trash !== undefined) {
      filters.trash = trash === "true" || trash === true;
    }

    // Handle search parameter
    const searchFilter = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { source: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const offset = (pageNum - 1) * limitNum;

    // Fetch orders with pagination
    const include = search
      ? [
          {
            model: Customer,
            as: "customer",
            where: { name: { [Op.like]: `%${search}%` } },
            attributes: ["name"],
            required: false,
          },
        ]
      : [
          {
            model: Customer,
            as: "customer",
            attributes: ["name"],
            required: false,
          },
        ];

    const orders = await Order.findAll({
      where: { ...filters, ...searchFilter },
      include,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset: offset,
    });

    // Get total count of matching orders
    const totalCount = await Order.count({
      where: { ...filters, ...searchFilter },
      include,
    });

    return res.status(200).json({
      orders,
      totalCount,
    });
  } catch (err) {
    console.error("Error in getFilteredOrders:", err.message, err.stack);
    return res.status(500).json({
      error: "Failed to fetch filtered orders",
      details: err.message,
    });
  }
};
exports.updateOrderTeam = async (req, res) => {
  try {
    const { id, assignedTo } = req.body;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (assignedTo) {
      const team = await Team.findByPk(assignedTo);
      if (!team)
        return res.status(400).json({ error: "Assigned team not found" });
    }

    order.assignedTo = assignedTo || null;
    await order.save();

    res.status(200).json({ message: "Order team updated", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
