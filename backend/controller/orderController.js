const Order = require("../models/orders"); // Sequelize Order model
const OrderItem = require("../models/orderItem"); // Sequelize OrderItem model
const Team = require("../models/team"); // Sequelize Team model
const Invoice = require("../models/invoice"); // Sequelize Invoice model
const Customer = require("../models/customers"); // Sequelize Customer model
const Quotation = require("../models/quotation"); // Sequelize Quotation model
const Comment = require("../models/comment"); // MongoDB Comment model
const User = require("../models/users"); // Sequelize User model
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // For unique file names
const ftp = require("basic-ftp"); // FTP client
require("dotenv").config(); // Load environment variables
const { Op } = require("sequelize");
const sanitizeHtml = require("sanitize-html"); // For XSS prevention
const { Readable } = require("stream");
const moment = require("moment");

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const uploadToCDN = async (file) => {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === "development";

  try {
    await client.access({
      host: process.env.FTP_HOST,
      port: process.env.FTP_PORT || 21,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: process.env.FTP_SECURE === "true",
    });

    // Check where FTP logs us in
    const cwd = await client.pwd();

    // Absolute path for storage
    const uploadDir = "/invoice_pdfs";
    await client.ensureDir(uploadDir);
    await client.cd(uploadDir);

    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;

    // Upload to current directory
    await client.uploadFrom(bufferToStream(file.buffer), uniqueName);

    // Construct public URL
    const fileUrl = `${process.env.FTP_BASE_URL}/invoice_pdfs/${uniqueName}`;
    return fileUrl;
  } catch (err) {
    throw new Error(`FTP upload failed: ${err.message}`);
  } finally {
    client.close();
  }
};

// Utility function for consistent error responses
const sendErrorResponse = (res, status, message, details = null) => {
  const response = { message };
  if (details) response.details = details;
  return res.status(status).json(response);
};

// Utility function to validate resource existence
const validateResource = async (resourceId, resourceType) => {
  const validResourceTypes = {
    Order: Order,
    Product: require("../models/product"), // Dynamically load Product model
    Customer: Customer,
  };

  const Model = validResourceTypes[resourceType];
  if (!Model) {
    return { valid: false, error: `Invalid resourceType: ${resourceType}` };
  }

  const resource = await Model.findByPk(resourceId);
  if (!resource) {
    return { valid: false, error: `${resourceType} not found` };
  }

  return { valid: true, resource };
};

// Utility function to validate comment input
// Utility function to validate comment input for creating comments
const validateCommentInput = ({
  resourceId,
  resourceType,
  userId,
  comment,
}) => {
  if (!resourceId || !resourceType || !userId || !comment?.trim()) {
    return {
      valid: false,
      error: "resourceId, resourceType, userId, and comment are required",
    };
  }

  const validResourceTypes = ["Order", "Product", "Customer"];
  if (!validResourceTypes.includes(resourceType)) {
    return { valid: false, error: `Invalid resourceType: ${resourceType}` };
  }

  return { valid: true };
};

// Utility function to validate comment input for fetching comments
const validateCommentFetchInput = ({ resourceId, resourceType }) => {
  if (!resourceId || !resourceType) {
    return {
      valid: false,
      error: "resourceId and resourceType are required",
    };
  }

  const validResourceTypes = ["Order", "Product", "Customer"];
  if (!validResourceTypes.includes(resourceType)) {
    return { valid: false, error: `Invalid resourceType: ${resourceType}` };
  }

  return { valid: true };
};

// Get comments for a resource
exports.getComments = async (req, res) => {
  try {
    const { resourceId, resourceType, page = 1, limit = 10 } = req.query;

    // Validate input for fetching comments
    const inputValidation = validateCommentFetchInput({
      resourceId,
      resourceType,
    });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    // Validate resource
    const resourceValidation = await validateResource(resourceId, resourceType);
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendErrorResponse(res, 400, "Invalid page number");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendErrorResponse(res, 400, "Invalid limit (must be 1-100)");
    }

    // Fetch comments
    const { comments, totalCount } = await fetchCommentsWithUsers(
      resourceId,
      resourceType,
      pageNum,
      limitNum
    );

    return res.status(200).json({
      comments,
      totalCount,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch comments", err.message);
  }
};

// Utility function to fetch comments with user details
const fetchCommentsWithUsers = async (
  resourceId,
  resourceType,
  pageNum,
  limitNum
) => {
  const comments = await Comment.find({ resourceId, resourceType })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .lean();

  const commentsWithUsers = await Promise.all(
    comments.map(async (comment) => {
      const user = await User.findByPk(comment.userId, {
        attributes: ["userId", "username", "name"],
      });
      return {
        ...comment,
        user: user ? user.toJSON() : null,
      };
    })
  );

  const totalCount = await Comment.countDocuments({ resourceId, resourceType });

  return { comments: commentsWithUsers, totalCount };
};

// Add a comment to a resource
exports.addComment = async (req, res) => {
  try {
    const { resourceId, resourceType, userId, comment } = req.body;

    // Validate input
    const inputValidation = validateCommentInput({
      resourceId,
      resourceType,
      userId,
      comment,
    });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    // Validate user
    const user = await User.findByPk(userId, {
      attributes: ["userId", "username", "name"],
    });
    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Validate resource
    const resourceValidation = await validateResource(resourceId, resourceType);
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

    // Check comment limit
    const hasReachedLimit = await Comment.hasReachedCommentLimit(
      resourceId,
      resourceType,
      userId
    );
    if (hasReachedLimit) {
      return sendErrorResponse(
        res,
        400,
        `User has reached the maximum of 3 comments for this ${resourceType.toLowerCase()}`
      );
    }

    // Sanitize comment to prevent XSS
    const sanitizedComment = sanitizeHtml(comment.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    });
    if (!sanitizedComment) {
      return sendErrorResponse(
        res,
        400,
        "Comment cannot be empty after sanitization"
      );
    }

    // Create the comment
    const newComment = await Comment.create({
      resourceId,
      resourceType,
      userId,
      comment: sanitizedComment,
    });

    // Fetch comment with user details
    const populatedComment = await Comment.findById(newComment._id).lean();
    populatedComment.user = user.toJSON();

    return res.status(201).json({
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to add comment", err.message);
  }
};

// Get comments for a resource

// Delete comments for a resource
exports.deleteCommentsByResource = async (req, res) => {
  try {
    const { resourceId, resourceType } = req.body;

    // Validate input
    const inputValidation = validateCommentInput({ resourceId, resourceType });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    // Delete comments
    const result = await Comment.deleteMany({ resourceId, resourceType });

    return res.status(200).json({
      message: `Deleted ${result.deletedCount} comments for ${resourceType}`,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to delete comments",
      err.message
    );
  }
};
// Delete a single comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body; // Assume userId is sent to check permissions

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return sendErrorResponse(res, 404, "Comment not found");
    }

    // Optional: Check if user has permission to delete (e.g., comment creator or admin)
    if (comment.userId !== userId) {
      return sendErrorResponse(res, 403, "Unauthorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to delete comment", err.message);
  }
};
// Create a new order
// createOrder.js
// Create a new order
// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
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
      orderNo,
      quotationId, // Added quotationId
    } = req.body;

    // Validate required fields
    if (!createdFor || !createdBy) {
      return sendErrorResponse(
        res,
        400,
        "createdFor, and createdBy are required"
      );
    }

    // Validate user
    const user = await User.findByPk(createdBy);
    if (!user) {
      return sendErrorResponse(res, 404, "Creator user not found");
    }

    // Validate customer
    const customer = await Customer.findByPk(createdFor);
    if (!customer) {
      return sendErrorResponse(res, 404, "Customer not found");
    }

    // Validate quotationId if provided
    if (quotationId) {
      const quotation = await Quotation.findByPk(quotationId);
      if (!quotation) {
        return sendErrorResponse(res, 404, "Quotation not found");
      }
    }

    // Validate dueDate
    if (dueDate && new Date(dueDate).toString() === "Invalid Date") {
      return sendErrorResponse(res, 400, "Invalid dueDate format");
    }

    // Validate and parse followupDates
    const parsedFollowupDates = Array.isArray(followupDates)
      ? followupDates.filter(
          (date) => date && new Date(date).toString() !== "Invalid Date"
        )
      : [];

    // Validate assignedTo
    const assignedTeamId = assignedTo?.trim?.() === "" ? null : assignedTo;
    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return sendErrorResponse(res, 400, "Assigned team not found");
      }
    }

    // Validate orderNo
    if (orderNo) {
      if (isNaN(parseInt(orderNo))) {
        return sendErrorResponse(res, 400, "orderNo must be a valid number");
      }
      const existingOrder = await Order.findOne({
        where: { orderNo: parseInt(orderNo) },
      });
      if (existingOrder) {
        return sendErrorResponse(res, 400, "Order number already exists");
      }
    }

    // Validate priority
    if (priority) {
      const validPriorities = ["high", "medium", "low"];
      if (!validPriorities.includes(priority.toLowerCase())) {
        return sendErrorResponse(res, 400, `Invalid priority: ${priority}`);
      }
    }

    // Validate status
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
    const normalizedStatus = status ? status.toUpperCase() : "CREATED";
    if (!validStatuses.includes(normalizedStatus)) {
      return sendErrorResponse(res, 400, `Invalid status: ${status}`);
    }

    // Create the order
    const order = await Order.create({
      createdFor,
      createdBy,
      pipeline,
      status: normalizedStatus,
      dueDate,
      assignedTo: assignedTeamId,
      followupDates: parsedFollowupDates,
      source,
      priority: priority?.toLowerCase() || null,
      description,
      orderNo: orderNo ? parseInt(orderNo) : null,
      quotationId, // Include quotationId
    });

    return res.status(201).json({
      message: "Order created successfully",
      id: order.id,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to create order", err.message);
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Customer,
          as: "customers",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "users",
          attributes: ["userId", "username", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      orders,
      totalCount: orders.length,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch orders", err.message);
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customers",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "users",
          attributes: ["userId", "username", "name"],
        },
        { model: Team, as: "team", attributes: ["id", "teamName"] },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, `Order with ID ${id} not found`);
    }

    // Fetch comments
    const { comments } = await fetchCommentsWithUsers(id, "Order", 1, 10);

    const orderWithComments = {
      ...order.toJSON(),
      comments,
    };

    return res.status(200).json({ order: orderWithComments });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch order details",
      err.message
    );
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return sendErrorResponse(res, 400, "id and status are required");
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

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
    const normalizedStatus = status.toUpperCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return sendErrorResponse(res, 400, `Invalid status: ${status}`);
    }

    order.status = normalizedStatus;
    await order.save();

    return res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to update order status",
      err.message
    );
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Delete associated comments
    await Comment.deleteMany({ resourceId: id, resourceType: "Order" });

    // Delete associated order items (fixed from deleteOne to destroy)
    await OrderItem.deleteOne({ where: { orderId: id } });

    // Delete the order
    await order.destroy();

    return res
      .status(200)
      .json({ message: "Order and associated data deleted successfully" });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to delete order", err.message);
  }
};

// Get recent orders
exports.recentOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Customer,
          as: "customers",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "users",
          attributes: ["userId", "username", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    return res.status(200).json({ orders });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch recent orders",
      err.message
    );
  }
};

// Get order by ID
exports.orderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customers",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "users",
          attributes: ["userId", "username", "name"],
        },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // Fetch comments
    const { comments } = await fetchCommentsWithUsers(id, "Order", 1, 10);

    const orderWithComments = {
      ...order.toJSON(),
      comments,
    };

    return res.status(200).json({ order: orderWithComments });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to fetch order", err.message);
  }
};

// Update order by ID
exports.updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Find the order
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate status
    if (updates.status) {
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
      const normalizedStatus = updates.status.toUpperCase();
      if (!validStatuses.includes(normalizedStatus)) {
        return res
          .status(400)
          .json({ message: `Invalid status: ${updates.status}` });
      }
      updates.status = normalizedStatus;
    }

    // Validate priority
    if (updates.priority) {
      const validPriorities = ["high", "medium", "low"];
      const normalizedPriority = updates.priority.toLowerCase();
      if (!validPriorities.includes(normalizedPriority)) {
        return res
          .status(400)
          .json({ message: `Invalid priority: ${updates.priority}` });
      }
      updates.priority = normalizedPriority;
    }

    // Validate dueDate
    if (updates.dueDate) {
      if (moment(updates.dueDate, "YYYY-MM-DD", true).isValid()) {
        updates.dueDate = moment(updates.dueDate).format("YYYY-MM-DD");
      } else {
        return res.status(400).json({ message: "Invalid dueDate format" });
      }
    }

    // Validate followupDates
    if (updates.followupDates) {
      if (!Array.isArray(updates.followupDates)) {
        return res
          .status(400)
          .json({ message: "followupDates must be an array" });
      }
      const invalidDates = updates.followupDates.filter(
        (date) => date && !moment(date, "YYYY-MM-DD", true).isValid()
      );
      if (invalidDates.length > 0) {
        return res
          .status(400)
          .json({ message: "Invalid followupDates format" });
      }
      if (updates.dueDate && updates.followupDates.length > 0) {
        const dueDate = moment(updates.dueDate);
        const invalidFollowupDates = updates.followupDates.filter(
          (date) => date && moment(date).isAfter(dueDate, "day")
        );
        if (invalidFollowupDates.length > 0) {
          return res.status(400).json({
            message: "Follow-up dates cannot be after the due date",
          });
        }
      }
      updates.followupDates = updates.followupDates.filter((date) => date);
    }

    // Validate assignedTo
    if (updates.assignedTo) {
      const team = await Team.findByPk(updates.assignedTo);
      if (!team) {
        return res.status(400).json({ message: "Assigned team not found" });
      }
    }

    // Validate createdBy
    if (updates.createdBy) {
      const user = await User.findByPk(updates.createdBy);
      if (!user) {
        return res.status(404).json({ message: "Creator user not found" });
      }
    }

    // Validate createdFor
    if (updates.createdFor) {
      const customer = await Customer.findByPk(updates.createdFor);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    // Validate orderNo
    if (updates.orderNo !== undefined) {
      if (updates.orderNo === "" || updates.orderNo === null) {
        updates.orderNo = null;
      } else if (isNaN(parseInt(updates.orderNo))) {
        return res
          .status(400)
          .json({ message: "orderNo must be a valid number" });
      } else {
        const existingOrder = await Order.findOne({
          where: { orderNo: parseInt(updates.orderNo), id: { [Op.ne]: id } },
        });
        if (existingOrder) {
          return res
            .status(400)
            .json({ message: "Order number already exists" });
        }
        updates.orderNo = parseInt(updates.orderNo);
      }
    }

    // Validate invoiceLink
    if (updates.invoiceLink && updates.invoiceLink.length > 500) {
      return res
        .status(400)
        .json({ message: "Invoice Link cannot exceed 500 characters" });
    }

    // Validate source
    if (updates.source && updates.source.length > 255) {
      return res
        .status(400)
        .json({ message: "Source cannot exceed 255 characters" });
    }

    // Validate quotationId
    if (updates.quotationId !== undefined) {
      if (updates.quotationId === null || updates.quotationId === "") {
        updates.quotationId = null; // Allow null as per model
      } else {
        const quotation = await Quotation.findByPk(updates.quotationId);
        if (!quotation) {
          return res.status(404).json({ message: "Quotation not found" });
        }
      }
    }

    // Perform update
    await order.update(updates);
    await order.reload();
    return res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to update order", error: err.message });
  }
};

// Create a draft order
exports.draftOrder = async (req, res) => {
  try {
    const { quotationId, assignedTo } = req.body;

    if (!assignedTo) {
      return sendErrorResponse(res, 400, "assignedTo are required");
    }

    const team = await Team.findByPk(assignedTo);
    if (!team) {
      return sendErrorResponse(res, 400, "Assigned team not found");
    }

    if (quotationId) {
      const quotation = await Quotation.findByPk(quotationId);
      if (!quotation) {
        return sendErrorResponse(res, 400, "Quotation not found");
      }
    }

    const order = await Order.create({
      quotationId,
      status: "DRAFT",
      assignedTo,
    });

    return res.status(200).json({ message: "Draft order created", order });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to create draft order",
      err.message
    );
  }
};

// Get filtered orders
exports.getFilteredOrders = async (req, res) => {
  try {
    const {
      status,
      priority,
      dueDate,
      createdBy,
      assignedTo,
      createdFor,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendErrorResponse(res, 400, "Invalid page number");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendErrorResponse(res, 400, "Invalid limit (must be 1-100)");
    }

    const filters = {};

    // Validate and apply status filter
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
        return sendErrorResponse(res, 400, `Invalid status: ${status}`);
      }
      filters.status = normalizedStatus;
    }

    // Validate and apply priority filter
    if (priority) {
      const normalizedPriority = priority.toLowerCase();
      const validPriorities = ["high", "medium", "low"];
      if (!validPriorities.includes(normalizedPriority)) {
        return sendErrorResponse(res, 400, `Invalid priority: ${priority}`);
      }
      filters.priority = normalizedPriority;
    }

    // Validate and apply dueDate filter
    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate)) {
        return sendErrorResponse(res, 400, "Invalid dueDate format");
      }
      filters.dueDate = parsedDate;
    }

    // Apply ID-based filters
    if (createdBy) {
      const user = await User.findByPk(createdBy);
      if (!user) {
        return sendErrorResponse(res, 404, "Creator user not found");
      }
      filters.createdBy = createdBy;
    }
    if (assignedTo) {
      const team = await Team.findByPk(assignedTo);
      if (!team) {
        return sendErrorResponse(res, 404, "Assigned team not found");
      }
      filters.assignedTo = assignedTo;
    }
    if (createdFor) {
      const customer = await Customer.findByPk(createdFor);
      if (!customer) {
        return sendErrorResponse(res, 404, "Customer not found");
      }
      filters.createdFor = createdFor;
    }

    // Handle search parameter
    const searchFilter = search
      ? {
          [Op.or]: [
            { source: { [Op.like]: `%${search}%` } },
            { "$customer.name$": { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const include = [
      {
        model: Customer,
        as: "customers",
        attributes: ["customerId", "name"],
        required: search ? false : undefined,
      },
      {
        model: User,
        as: "users",
        attributes: ["userId", "username", "name"],
      },
    ];

    const offset = (pageNum - 1) * limitNum;

    // Fetch orders with pagination and associations
    const orders = await Order.findAll({
      where: { ...filters, ...searchFilter },
      include,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    // Get total count
    const totalCount = await Order.count({
      where: { ...filters, ...searchFilter },
      include: search ? include : [],
    });

    // Optionally fetch comments for each order
    const ordersWithComments = await Promise.all(
      orders.map(async (order) => {
        const { comments } = await fetchCommentsWithUsers(
          order.id,
          "Order",
          1,
          10
        );
        return {
          ...order.toJSON(),
          comments,
        };
      })
    );

    return res.status(200).json({
      orders: ordersWithComments,
      totalCount,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch filtered orders",
      err.message
    );
  }
};

// Update order team
exports.updateOrderTeam = async (req, res) => {
  try {
    const { id, assignedTo } = req.body;

    if (!id) {
      return sendErrorResponse(res, 400, "Order ID is required");
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    if (assignedTo) {
      const team = await Team.findByPk(assignedTo);
      if (!team) {
        return sendErrorResponse(res, 400, "Assigned team not found");
      }
    }

    order.assignedTo = assignedTo || null;
    await order.save();

    return res.status(200).json({ message: "Order team updated", order });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to update order team",
      err.message
    );
  }
};

exports.uploadInvoiceAndLinkOrder = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Generate unique filename
    const ext = path.extname(req.file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;

    // FTP upload
    const client = new ftp.Client();
    client.ftp.verbose = process.env.NODE_ENV === "development"; // Enable verbose logging in development

    try {
      await client.access({
        host: process.env.FTP_HOST,
        port: process.env.FTP_PORT || 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: process.env.FTP_SECURE === "true" || false,
      });

      // Log current FTP directory for debugging
      const cwd = await client.pwd();

      // Ensure folder exists for invoices
      const uploadDir = "/invoice_pdfs";
      await client.ensureDir(uploadDir);
      await client.cd(uploadDir); // Change to /invoice_pdfs

      // Convert buffer to stream and upload
      const stream = bufferToStream(req.file.buffer);
      await client.uploadFrom(stream, uniqueName); // Upload to current directory

      // Construct public URL
      const fileUrl = `${process.env.FTP_BASE_URL}/invoice_pdfs/${uniqueName}`;
    } catch (ftpErr) {
      return res
        .status(500)
        .json({ message: "FTP upload failed", error: ftpErr.message });
    } finally {
      client.close();
    }

    // Update order record in DB
    const [updated] = await Order.update(
      { invoiceLink: `${process.env.FTP_BASE_URL}/invoice_pdfs/${uniqueName}` }, // Use invoiceLink to match model
      { where: { id: req.params.orderId } } // Use id to match model
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Invoice uploaded successfully",
      filename: uniqueName,
      size: req.file.size,
      fileUrl: `${process.env.FTP_BASE_URL}/invoice_pdfs/${uniqueName}`, // Return relative path
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
// GET /api/order/count?date=YYYY-MM-DD
exports.countOrders = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !moment(date, "YYYY-MM-DD").isValid()) {
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const startOfDay = moment(date).startOf("day").toDate();
    const endOfDay = moment(date).endOf("day").toDate();

    const count = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
