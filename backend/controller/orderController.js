const Order = require("../models/orders");
const OrderItem = require("../models/orderItem");
const Team = require("../models/team");
const Invoice = require("../models/invoice");
const Customer = require("../models/customers");
const Quotation = require("../models/quotation");
const Comment = require("../models/comment");
const User = require("../models/users");
const Product = require("../models/product");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ftp = require("basic-ftp");
require("dotenv").config();
const { Op } = require("sequelize");
const sanitizeHtml = require("sanitize-html");
const { Readable } = require("stream");
const moment = require("moment");
const { sendNotification } = require("./notificationController"); // Import sendNotification

// Assume an admin user ID or system channel for notifications
const ADMIN_USER_ID = "admin-system"; // Replace with actual admin user ID or channel

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

    const cwd = await client.pwd();
    const uploadDir = "/invoice_pdfs";
    await client.ensureDir(uploadDir);
    await client.cd(uploadDir);

    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    await client.uploadFrom(bufferToStream(file.buffer), uniqueName);
    const fileUrl = `${process.env.FTP_BASE_URL}/invoice_pdfs/${uniqueName}`;
    return fileUrl;
  } catch (err) {
    throw new Error(`FTP upload failed: ${err.message}`);
  } finally {
    client.close();
  }
};

const sendErrorResponse = (res, status, message, details = null) => {
  const response = { message };
  if (details) response.details = details;
  return res.status(status).json(response);
};

const validateResource = async (resourceId, resourceType) => {
  const validResourceTypes = {
    Order: Order,
    Product: Product,
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

// Get comments (no notification needed)
exports.getComments = async (req, res) => {
  try {
    const { resourceId, resourceType, page = 1, limit = 10 } = req.query;

    const inputValidation = validateCommentFetchInput({
      resourceId,
      resourceType,
    });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    const resourceValidation = await validateResource(resourceId, resourceType);
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendErrorResponse(res, 400, "Invalid page number");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendErrorResponse(res, 400, "Invalid limit (must be 1-100)");
    }

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

// Add a comment
exports.addComment = async (req, res) => {
  try {
    const { resourceId, resourceType, userId, comment } = req.body;

    const inputValidation = validateCommentInput({
      resourceId,
      resourceType,
      userId,
      comment,
    });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    const user = await User.findByPk(userId, {
      attributes: ["userId", "username", "name"],
    });
    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    const resourceValidation = await validateResource(resourceId, resourceType);
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

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

    const newComment = await Comment.create({
      resourceId,
      resourceType,
      userId,
      comment: sanitizedComment,
    });

    const populatedComment = await Comment.findById(newComment._id).lean();
    populatedComment.user = user.toJSON();

    // If resourceType is Order, notify customer, creator, assignedUserId, and secondaryUserId
    if (resourceType === "Order") {
      const order = await Order.findByPk(resourceId);
      if (order) {
        const recipients = new Set(
          [
            order.createdFor,
            order.createdBy,
            order.assignedUserId,
            order.secondaryUserId,
          ].filter((id) => id)
        );
        for (const recipientId of recipients) {
          await sendNotification({
            userId: recipientId,
            title: `New Comment on Order #${order.orderNo}`,
            message: `A new comment has been added to your order: "${sanitizedComment}" by ${user.name}`,
          });
        }
      }
    } else if (resourceType === "Customer") {
      // Notify the customer
      await sendNotification({
        userId: resourceId, // Assuming customerId can be used as userId
        title: "New Comment on Your Profile",
        message: `A new comment has been added to your profile: "${sanitizedComment}" by ${user.name}`,
      });
    }

    return res.status(201).json({
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to add comment", err.message);
  }
};

// Delete comments by resource
exports.deleteCommentsByResource = async (req, res) => {
  try {
    const { resourceId, resourceType } = req.body;

    const inputValidation = validateCommentInput({ resourceId, resourceType });
    if (!inputValidation.valid) {
      return sendErrorResponse(res, 400, inputValidation.error);
    }

    const resourceValidation = await validateResource(resourceId, resourceType);
    if (!resourceValidation.valid) {
      return sendErrorResponse(res, 404, resourceValidation.error);
    }

    const result = await Comment.deleteMany({ resourceId, resourceType });

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Comments Deleted for ${resourceType}`,
      message: `${result.deletedCount} comments deleted for ${resourceType} ID ${resourceId}`,
    });

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

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return sendErrorResponse(res, 404, "Comment not found");
    }

    if (comment.userId !== userId) {
      return sendErrorResponse(res, 403, "Unauthorized to delete this comment");
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Comment Deleted on ${comment.resourceType}`,
      message: `Comment on ${comment.resourceType} ID ${comment.resourceId} by user ${userId} has been deleted: "${comment.comment}"`,
    });

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to delete comment", err.message);
  }
};

// Create an order
exports.createOrder = async (req, res) => {
  try {
    const {
      createdFor,
      createdBy,
      pipeline,
      status,
      dueDate,
      assignedTeamId,
      assignedUserId,
      secondaryUserId,
      followupDates,
      source,
      priority,
      description,
      orderNo,
      quotationId,
      products,
      masterPipelineNo,
      previousOrderNo,
    } = req.body;

    // Validate required fields
    if (!createdFor || !createdBy || !orderNo) {
      return sendErrorResponse(
        res,
        400,
        "createdFor, createdBy, and orderNo are required"
      );
    }

    // Validate user (createdBy)
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

    // Validate masterPipelineNo if provided
    if (masterPipelineNo) {
      const masterOrder = await Order.findOne({
        where: { orderNo: masterPipelineNo },
      });
      if (!masterOrder) {
        return sendErrorResponse(
          res,
          404,
          `Master order with orderNo ${masterPipelineNo} not found`
        );
      }
      if (masterPipelineNo === orderNo) {
        return sendErrorResponse(
          res,
          400,
          "Master pipeline number cannot be the same as order number"
        );
      }
    }

    // Validate previousOrderNo if provided
    if (previousOrderNo) {
      const previousOrder = await Order.findOne({
        where: { orderNo: previousOrderNo },
      });
      if (!previousOrder) {
        return sendErrorResponse(
          res,
          404,
          `Previous order with orderNo ${previousOrderNo} not found`
        );
      }
      if (previousOrderNo === orderNo) {
        return sendErrorResponse(
          res,
          400,
          "Previous order number cannot be the same as order number"
        );
      }
    }

    // Validate products array
    if (products) {
      if (!Array.isArray(products)) {
        return sendErrorResponse(res, 400, "Products must be an array");
      }

      for (const product of products) {
        const { id, price, discount, total } = product;

        if (
          !id ||
          price === undefined ||
          discount === undefined ||
          total === undefined
        ) {
          return sendErrorResponse(
            res,
            400,
            "Each product must have id, price, discount, and total"
          );
        }

        const productRecord = await Product.findByPk(id);
        if (!productRecord) {
          return sendErrorResponse(res, 404, `Product with ID ${id} not found`);
        }

        if (typeof price !== "number" || price < 0) {
          return sendErrorResponse(res, 400, `Invalid price for product ${id}`);
        }
        if (typeof discount !== "number" || discount < 0) {
          return sendErrorResponse(
            res,
            400,
            `Invalid discount for product ${id}`
          );
        }
        if (typeof total !== "number" || total < 0) {
          return sendErrorResponse(res, 400, `Invalid total for product ${id}`);
        }

        const discountType = productRecord.discountType || "fixed";
        let expectedTotal;
        if (discountType === "percent") {
          expectedTotal = price * (1 - discount / 100);
        } else {
          expectedTotal = price - discount;
        }

        if (Math.abs(total - expectedTotal) > 0.01) {
          return sendErrorResponse(
            res,
            400,
            `Invalid total for product ${id}. Expected ${expectedTotal.toFixed(
              2
            )} based on price and discount`
          );
        }
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

    // Validate assignedTeamId
    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return sendErrorResponse(res, 400, "Assigned team not found");
      }
    }

    // Validate assignedUserId
    if (assignedUserId) {
      const assignedUser = await User.findByPk(assignedUserId);
      if (!assignedUser) {
        return sendErrorResponse(res, 400, "Assigned user not found");
      }
    }

    // Validate secondaryUserId
    if (secondaryUserId) {
      const secondaryUser = await User.findByPk(secondaryUserId);
      if (!secondaryUser) {
        return sendErrorResponse(res, 400, "Secondary user not found");
      }
    }

    // Validate orderNo
    if (isNaN(parseInt(orderNo))) {
      return sendErrorResponse(res, 400, "orderNo must be a valid number");
    }
    const existingOrder = await Order.findOne({
      where: { orderNo: parseInt(orderNo) },
    });
    if (existingOrder) {
      return sendErrorResponse(res, 400, "Order number already exists");
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
      assignedTeamId,
      assignedUserId,
      secondaryUserId,
      followupDates: parsedFollowupDates,
      source,
      priority: priority?.toLowerCase() || "medium",
      description,
      orderNo: parseInt(orderNo),
      quotationId,
      products,
      masterPipelineNo,
      previousOrderNo,
    });

    // Send notification to creator, assignedUserId, and secondaryUserId
    const recipients = new Set(
      [createdBy, assignedUserId, secondaryUserId].filter((id) => id)
    );
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `New Order Created #${orderNo}`,
        message: `Order #${orderNo} has been created for ${customer.name}.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New Order Created #${orderNo}`,
      message: `Order #${orderNo} created for ${customer.name} by ${user.name}.`,
    });

    // If assigned to a team, notify team members
    if (assignedTeamId) {
      const teamMembers = await User.findAll({
        include: [
          {
            model: Team,
            as: "teams",
            where: { id: assignedTeamId },
          },
        ],
        attributes: ["userId", "name"],
      });
      for (const member of teamMembers) {
        await sendNotification({
          userId: member.userId,
          title: `Order Assigned to Team #${orderNo}`,
          message: `Order #${orderNo} has been assigned to your team for ${customer.name}.`,
        });
      }
    }

    return res.status(201).json({
      message: "Order created successfully",
      id: order.id,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to create order", err.message);
  }
};

// Get all orders (no notification needed)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
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

// Get order details (no notification needed)
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "nextOrders",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "pipelineOrders",
          attributes: ["id", "orderNo"],
        },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, `Order with ID ${id} not found`);
    }

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

    const oldStatus = order.status;
    order.status = normalizedStatus;
    await order.save();

    // Fetch customer for notification
    const customer = await Customer.findByPk(order.createdFor);

    // Send notification to creator, assignedUserId, and secondaryUserId
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        (id) => id
      )
    );
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `Order Status Updated #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${
          customer?.name || "Customer"
        } has been updated to ${normalizedStatus}.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Status Updated #${order.orderNo}`,
      message: `Order #${
        order.orderNo
      } status changed from ${oldStatus} to ${normalizedStatus} for ${
        customer?.name || "Customer"
      }.`,
    });

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

    // Check if the order is referenced by other orders
    const dependentOrders = await Order.findAll({
      where: {
        [Op.or]: [
          { previousOrderNo: order.orderNo },
          { masterPipelineNo: order.orderNo },
        ],
      },
    });
    if (dependentOrders.length > 0) {
      return sendErrorResponse(
        res,
        400,
        "Cannot delete order as it is referenced by other orders in the pipeline"
      );
    }

    // Fetch customer for notification
    const customer = await Customer.findByPk(order.createdFor);

    // Send notification to creator, assignedUserId, and secondaryUserId
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        (id) => id
      )
    );
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `Order Deleted #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${
          customer?.name || "Customer"
        } has been deleted.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Deleted #${order.orderNo}`,
      message: `Order #${order.orderNo} for ${
        customer?.name || "Customer"
      } has been deleted.`,
    });

    await Comment.deleteMany({ resourceId: id, resourceType: "Order" });
    await OrderItem.destroy({ where: { orderId: id } });
    await order.destroy();

    return res
      .status(200)
      .json({ message: "Order and associated data deleted successfully" });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to delete order", err.message);
  }
};

// Get recent orders (no notification needed)
exports.recentOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
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

// Get order by ID (no notification needed)
exports.orderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customerId", "name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "assignedUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: User,
          as: "secondaryUser",
          attributes: ["userId", "username", "name"],
        },
        {
          model: Team,
          as: "assignedTeam",
          attributes: ["id", "teamName"],
        },
        {
          model: Order,
          as: "previousOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "masterOrder",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "nextOrders",
          attributes: ["id", "orderNo"],
        },
        {
          model: Order,
          as: "pipelineOrders",
          attributes: ["id", "orderNo"],
        },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

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

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

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

    if (updates.dueDate) {
      if (moment(updates.dueDate, "YYYY-MM-DD", true).isValid()) {
        updates.dueDate = moment(updates.dueDate).format("YYYY-MM-DD");
      } else {
        return res.status(400).json({ message: "Invalid dueDate format" });
      }
    }

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

    if (updates.assignedTeamId) {
      const team = await Team.findByPk(updates.assignedTeamId);
      if (!team) {
        return res.status(400).json({ message: "Assigned team not found" });
      }
    }

    if (updates.assignedUserId) {
      const assignedUser = await User.findByPk(updates.assignedUserId);
      if (!assignedUser) {
        return res.status(400).json({ message: "Assigned user not found" });
      }
    }

    if (updates.secondaryUserId) {
      const secondaryUser = await User.findByPk(updates.secondaryUserId);
      if (!secondaryUser) {
        return res.status(400).json({ message: "Secondary user not found" });
      }
    }

    if (updates.createdBy) {
      const user = await User.findByPk(updates.createdBy);
      if (!user) {
        return res.status(404).json({ message: "Creator user not found" });
      }
    }

    if (updates.createdFor) {
      const customer = await Customer.findByPk(updates.createdFor);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    if (updates.orderNo !== undefined) {
      if (updates.orderNo === "" || updates.orderNo === null) {
        return res.status(400).json({ message: "orderNo is required" });
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

    if (updates.masterPipelineNo !== undefined) {
      if (
        updates.masterPipelineNo === null ||
        updates.masterPipelineNo === ""
      ) {
        updates.masterPipelineNo = null;
      } else {
        const masterOrder = await Order.findOne({
          where: { orderNo: updates.masterPipelineNo },
        });
        if (!masterOrder) {
          return res.status(404).json({
            message: `Master order with orderNo ${updates.masterPipelineNo} not found`,
          });
        }
        if (updates.masterPipelineNo === order.orderNo) {
          return res.status(400).json({
            message:
              "Master pipeline number cannot be the same as order number",
          });
        }
      }
    }

    if (updates.previousOrderNo !== undefined) {
      if (updates.previousOrderNo === null || updates.previousOrderNo === "") {
        updates.previousOrderNo = null;
      } else {
        const previousOrder = await Order.findOne({
          where: { orderNo: updates.previousOrderNo },
        });
        if (!previousOrder) {
          return res.status(404).json({
            message: `Previous order with orderNo ${updates.previousOrderNo} not found`,
          });
        }
        if (updates.previousOrderNo === order.orderNo) {
          return res.status(400).json({
            message: "Previous order number cannot be the same as order number",
          });
        }
      }
    }

    if (updates.invoiceLink && updates.invoiceLink.length > 500) {
      return res
        .status(400)
        .json({ message: "Invoice Link cannot exceed 500 characters" });
    }

    if (updates.source && updates.source.length > 255) {
      return res
        .status(400)
        .json({ message: "Source cannot exceed 255 characters" });
    }

    if (updates.quotationId !== undefined) {
      if (updates.quotationId === null || updates.quotationId === "") {
        updates.quotationId = null;
      } else {
        const quotation = await Quotation.findByPk(updates.quotationId);
        if (!quotation) {
          return res.status(404).json({ message: "Quotation not found" });
        }
      }
    }

    if (updates.products !== undefined) {
      if (updates.products === null || updates.products === "") {
        updates.products = null;
      } else if (!Array.isArray(updates.products)) {
        return res.status(400).json({ message: "Products must be an array" });
      } else {
        for (const product of updates.products) {
          const { id, price, discount, total } = product;

          if (
            !id ||
            price === undefined ||
            discount === undefined ||
            total === undefined
          ) {
            return res.status(400).json({
              message: "Each product must have id, price, discount, and total",
            });
          }

          const productRecord = await Product.findByPk(id);
          if (!productRecord) {
            return res
              .status(404)
              .json({ message: `Product with ID ${id} not found` });
          }

          if (typeof price !== "number" || price < 0) {
            return res
              .status(400)
              .json({ message: `Invalid price for product ${id}` });
          }
          if (typeof discount !== "number" || discount < 0) {
            return res
              .status(400)
              .json({ message: `Invalid discount for product ${id}` });
          }
          if (typeof total !== "number" || total < 0) {
            return res
              .status(400)
              .json({ message: `Invalid total for product ${id}` });
          }

          const discountType = productRecord.discountType || "fixed";
          let expectedTotal;
          if (discountType === "percent") {
            expectedTotal = price * (1 - discount / 100);
          } else {
            expectedTotal = price - discount;
          }

          if (Math.abs(total - expectedTotal) > 0.01) {
            return res.status(400).json({
              message: `Invalid total for product ${id}. Expected ${expectedTotal.toFixed(
                2
              )} based on price and discount`,
            });
          }
        }
      }
    }

    // Fetch customer for notification
    const customer = await Customer.findByPk(order.createdFor);

    await order.update(updates);
    await order.reload();

    // Send notification to creator, assignedUserId, and secondaryUserId
    const recipients = new Set(
      [
        order.createdBy,
        updates.assignedUserId || order.assignedUserId,
        updates.secondaryUserId || order.secondaryUserId,
      ].filter((id) => id)
    );
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `Order Updated #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${
          customer?.name || "Customer"
        } has been updated.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Updated #${order.orderNo}`,
      message: `Order #${order.orderNo} for ${
        customer?.name || "Customer"
      } has been updated.`,
    });

    // If assignedTeamId is updated, notify team members
    if (
      updates.assignedTeamId &&
      updates.assignedTeamId !== order.assignedTeamId
    ) {
      const teamMembers = await User.findAll({
        include: [
          {
            model: Team,
            as: "teams",
            where: { id: updates.assignedTeamId },
          },
        ],
        attributes: ["userId", "name"],
      });
      for (const member of teamMembers) {
        await sendNotification({
          userId: member.userId,
          title: `Order Assigned to Team #${order.orderNo}`,
          message: `Order #${
            order.orderNo
          } has been assigned to your team for ${
            customer?.name || "Customer"
          }.`,
        });
      }
    }

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
    const {
      quotationId,
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
    } = req.body;

    if (!assignedTeamId) {
      return sendErrorResponse(res, 400, "assignedTeamId is required");
    }

    const team = await Team.findByPk(assignedTeamId);
    if (!team) {
      return sendErrorResponse(res, 400, "Assigned team not found");
    }

    if (quotationId) {
      const quotation = await Quotation.findByPk(quotationId);
      if (!quotation) {
        return sendErrorResponse(res, 400, "Quotation not found");
      }
    }

    if (masterPipelineNo) {
      const masterOrder = await Order.findOne({
        where: { orderNo: masterPipelineNo },
      });
      if (!masterOrder) {
        return sendErrorResponse(
          res,
          404,
          `Master order with orderNo ${masterPipelineNo} not found`
        );
      }
    }

    if (previousOrderNo) {
      const previousOrder = await Order.findOne({
        where: { orderNo: previousOrderNo },
      });
      if (!previousOrder) {
        return sendErrorResponse(
          res,
          404,
          `Previous order with orderNo ${previousOrderNo} not found`
        );
      }
    }

    if (products) {
      if (!Array.isArray(products)) {
        return sendErrorResponse(res, 400, "Products must be an array");
      }

      for (const product of products) {
        const { id, price, discount, total } = product;

        if (
          !id ||
          price === undefined ||
          discount === undefined ||
          total === undefined
        ) {
          return sendErrorResponse(
            res,
            400,
            "Each product must have id, price, discount, and total"
          );
        }

        const productRecord = await Product.findByPk(id);
        if (!productRecord) {
          return sendErrorResponse(res, 404, `Product with ID ${id} not found`);
        }

        if (typeof price !== "number" || price < 0) {
          return sendErrorResponse(res, 400, `Invalid price for product ${id}`);
        }
        if (typeof discount !== "number" || discount < 0) {
          return sendErrorResponse(
            res,
            400,
            `Invalid discount for product ${id}`
          );
        }
        if (typeof total !== "number" || total < 0) {
          return sendErrorResponse(res, 400, `Invalid total for product ${id}`);
        }

        const discountType = productRecord.discountType || "fixed";
        let expectedTotal;
        if (discountType === "percent") {
          expectedTotal = price * (1 - discount / 100);
        } else {
          expectedTotal = price - discount;
        }

        if (Math.abs(total - expectedTotal) > 0.01) {
          return sendErrorResponse(
            res,
            400,
            `Invalid total for product ${id}. Expected ${expectedTotal.toFixed(
              2
            )} based on price and discount`
          );
        }
      }
    }

    // Generate unique orderNo for draft order
    const today = moment().format("DDMMYYYY");
    const todayOrders = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: moment().startOf("day").toDate(),
          [Op.lte]: moment().endOf("day").toDate(),
        },
      },
    });
    const serialNumber = String(todayOrders.length + 1).padStart(5, "0");
    const orderNo = `${today}${serialNumber}`;

    const order = await Order.create({
      quotationId,
      status: "DRAFT",
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
      orderNo: parseInt(orderNo),
    });

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Draft Order Created #${orderNo}`,
      message: `A draft order #${orderNo} has been created.`,
    });

    // Notify team members
    const teamMembers = await User.findAll({
      include: [
        {
          model: Team,
          as: "teams",
          where: { id: assignedTeamId },
        },
      ],
      attributes: ["userId", "name"],
    });
    for (const member of teamMembers) {
      await sendNotification({
        userId: member.userId,
        title: `Draft Order Assigned to Team #${orderNo}`,
        message: `Draft order #${orderNo} has been assigned to your team.`,
      });
    }

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

// Get filtered orders (no notification needed)
exports.getFilteredOrders = async (req, res) => {
  try {
    const {
      status,
      priority,
      dueDate,
      createdBy,
      assignedTeamId,
      createdFor,
      search,
      page = 1,
      limit = 10,
      masterPipelineNo,
      previousOrderNo,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendErrorResponse(res, 400, "Invalid page number");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendErrorResponse(res, 400, "Invalid limit (must be 1-100)");
    }

    const filters = {};

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

    if (priority) {
      const normalizedPriority = priority.toLowerCase();
      const validPriorities = ["high", "medium", "low"];
      if (!validPriorities.includes(normalizedPriority)) {
        return sendErrorResponse(res, 400, `Invalid priority: ${priority}`);
      }
      filters.priority = normalizedPriority;
    }

    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate)) {
        return sendErrorResponse(res, 400, "Invalid dueDate format");
      }
      filters.dueDate = parsedDate;
    }

    if (createdBy) {
      const user = await User.findByPk(createdBy);
      if (!user) {
        return sendErrorResponse(res, 404, "Creator user not found");
      }
      filters.createdBy = createdBy;
    }

    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return sendErrorResponse(res, 404, "Assigned team not found");
      }
      filters.assignedTeamId = assignedTeamId;
    }

    if (createdFor) {
      const customer = await Customer.findByPk(createdFor);
      if (!customer) {
        return sendErrorResponse(res, 404, "Customer not found");
      }
      filters.createdFor = createdFor;
    }

    if (masterPipelineNo) {
      const masterOrder = await Order.findOne({
        where: { orderNo: masterPipelineNo },
      });
      if (!masterOrder) {
        return sendErrorResponse(
          res,
          404,
          `Master order with orderNo ${masterPipelineNo} not found`
        );
      }
      filters.masterPipelineNo = masterPipelineNo;
    }

    if (previousOrderNo) {
      const previousOrder = await Order.findOne({
        where: { orderNo: previousOrderNo },
      });
      if (!previousOrder) {
        return sendErrorResponse(
          res,
          404,
          `Previous order with orderNo ${previousOrderNo} not found`
        );
      }
      filters.previousOrderNo = previousOrderNo;
    }

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
        as: "customer",
        attributes: ["customerId", "name"],
        required: search ? false : undefined,
      },
      {
        model: User,
        as: "creator",
        attributes: ["userId", "username", "name"],
      },
      {
        model: User,
        as: "assignedUser",
        attributes: ["userId", "username", "name"],
      },
      {
        model: User,
        as: "secondaryUser",
        attributes: ["userId", "username", "name"],
      },
      {
        model: Team,
        as: "assignedTeam",
        attributes: ["id", "teamName"],
      },
      {
        model: Order,
        as: "previousOrder",
        attributes: ["id", "orderNo"],
      },
      {
        model: Order,
        as: "masterOrder",
        attributes: ["id", "orderNo"],
      },
    ];

    const offset = (pageNum - 1) * limitNum;

    const orders = await Order.findAll({
      where: { ...filters, ...searchFilter },
      include,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

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

    const totalCount = await Order.count({
      where: { ...filters, ...searchFilter },
      include: search ? include : [],
    });

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
    const { id, assignedTeamId } = req.body;

    if (!id) {
      return sendErrorResponse(res, 400, "Order ID is required");
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    if (assignedTeamId) {
      const team = await Team.findByPk(assignedTeamId);
      if (!team) {
        return sendErrorResponse(res, 400, "Assigned team not found");
      }
    }

    const previousTeamId = order.assignedTeamId;
    order.assignedTeamId = assignedTeamId || null;
    await order.save();

    // Fetch customer for notification
    const customer = await Customer.findByPk(order.createdFor);

    // Send notification to creator, assignedUserId, and secondaryUserId
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        (id) => id
      )
    );
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `Order Team Updated #${order.orderNo}`,
        message: `The team for order #${order.orderNo} for ${
          customer?.name || "Customer"
        } has been updated.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Team Updated #${order.orderNo}`,
      message: `The team for order #${order.orderNo} for ${
        customer?.name || "Customer"
      } has been updated.`,
    });

    // Notify new team members if assignedTeamId changed
    if (assignedTeamId && assignedTeamId !== previousTeamId) {
      const teamMembers = await User.findAll({
        include: [
          {
            model: Team,
            as: "teams",
            where: { id: assignedTeamId },
          },
        ],
        attributes: ["userId", "name"],
      });
      for (const member of teamMembers) {
        await sendNotification({
          userId: member.userId,
          title: `Order Assigned to Team #${order.orderNo}`,
          message: `Order #${
            order.orderNo
          } has been assigned to your team for ${
            customer?.name || "Customer"
          }.`,
        });
      }
    }

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

// Upload invoice and link to order
exports.uploadInvoiceAndLinkOrder = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = path.extname(req.file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;

    const client = new ftp.Client();
    client.ftp.verbose = process.env.NODE_ENV === "development";

    let fileUrl;
    try {
      await client.access({
        host: process.env.FTP_HOST,
        port: process.env.FTP_PORT || 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: process.env.FTP_SECURE === "true" || false,
      });

      const cwd = await client.pwd();
      const uploadDir = "/invoice_pdfs";
      await client.ensureDir(uploadDir);
      await client.cd(uploadDir);

      const stream = bufferToStream(req.file.buffer);
      await client.uploadFrom(stream, uniqueName);

      fileUrl = `${process.env.FTP_BASE_URL}/invoice_pdfs/${uniqueName}`;
    } catch (ftpErr) {
      return res
        .status(500)
        .json({ message: "FTP upload failed", error: ftpErr.message });
    } finally {
      client.close();
    }

    const [updated] = await Order.update(
      { invoiceLink: fileUrl },
      { where: { id: req.params.orderId } }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = await Order.findByPk(req.params.orderId);
    const customer = await Customer.findByPk(order.createdFor);

    // Send notification to creator, assignedUserId, and secondaryUserId
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        (id) => id
      )
    );
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `Invoice Uploaded for Order #${order.orderNo}`,
        message: `An invoice has been uploaded for order #${
          order.orderNo
        } for ${customer?.name || "Customer"}.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Invoice Uploaded for Order #${order.orderNo}`,
      message: `An invoice has been uploaded for order #${order.orderNo} for ${
        customer?.name || "Customer"
      }.`,
    });

    return res.status(200).json({
      message: "Invoice uploaded successfully",
      filename: uniqueName,
      size: req.file.size,
      fileUrl,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// Count orders (no notification needed)
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
