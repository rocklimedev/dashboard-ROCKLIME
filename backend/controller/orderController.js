const Order = require("../models/orders");
const OrderItem = require("../models/orderItem");
const Team = require("../models/team");
const Invoice = require("../models/invoice");
const Customer = require("../models/customers");
const Quotation = require("../models/quotation");
const Address = require("../models/address");
const Comment = require("../models/comment");
const User = require("../models/users");
const Product = require("../models/product");
const InventoryHistory = require("../models/history");
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
const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60"; // Replace with actual admin user ID or channel

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
      shipTo,
      shipping, // <---- added
    } = req.body;

    // Validate required fields
    if (!createdFor || !createdBy || !orderNo) {
      return sendErrorResponse(
        res,
        400,
        "createdFor, createdBy, and orderNo are required"
      );
    }
    if (shipping != null) {
      const parsedShipping = parseFloat(shipping);
      if (isNaN(parsedShipping) || parsedShipping < 0) {
        return sendErrorResponse(res, 400, "Invalid shipping amount");
      }
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

    // Validate products array if provided
    let productUpdates = [];
    if (products) {
      if (!Array.isArray(products) || products.length === 0) {
        return sendErrorResponse(
          res,
          400,
          "Products must be a non-empty array"
        );
      }

      for (const product of products) {
        const { id, price, discount, total, quantity } = product;

        if (
          !id ||
          price == null || // null or undefined
          discount == null ||
          total == null ||
          quantity == null ||
          quantity < 1
        ) {
          return sendErrorResponse(
            res,
            400,
            "Each product must have id, price, discount, total, and quantity (>= 1)"
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
          expectedTotal = price * (1 - discount / 100) * quantity;
        } else {
          expectedTotal = (price - discount) * quantity;
        }

        if (Math.abs(total - expectedTotal) > 0.01) {
          return sendErrorResponse(
            res,
            400,
            `Invalid total for product ${id}. Expected ${expectedTotal.toFixed(
              2
            )} based on price, discount, and quantity`
          );
        }

        // Check if sufficient quantity is available
        if (productRecord.quantity < quantity) {
          return sendErrorResponse(
            res,
            400,
            `Insufficient stock for product ${id}. Available: ${productRecord.quantity}, Requested: ${quantity}`
          );
        }

        // Prepare product quantity update
        productUpdates.push({
          productId: id,
          quantityToReduce: quantity,
          productRecord,
        });
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

    // Validate shipTo if provided
    let addressDetails = null;
    if (shipTo) {
      const address = await Address.findByPk(shipTo);
      if (!address) {
        return sendErrorResponse(
          res,
          404,
          `Address with ID ${shipTo} not found`
        );
      }
      addressDetails = address.toJSON();
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
    const normalizedStatus = status ? status.toUpperCase() : "PREPARING";
    if (!validStatuses.includes(normalizedStatus)) {
      return sendErrorResponse(res, 400, `Invalid status: ${status}`);
    }

    // Create the order
    const order = await Order.create({
      createdFor,
      createdBy,
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
      shipTo,
      shipping: shipping ?? 0, // <---- added
    });

    // Update product quantities and inventory history if products are provided
    if (productUpdates.length > 0) {
      for (const update of productUpdates) {
        const { productId, quantityToReduce, productRecord } = update;

        // 1. Update Product (Sequelize)
        const newQuantity = productRecord.quantity - quantityToReduce;
        await Product.update(
          { quantity: newQuantity },
          { where: { productId } }
        );

        // 2. Update InventoryHistory (Mongoose)
        try {
          await InventoryHistory.findOneAndUpdate(
            { productId },
            {
              $push: {
                history: {
                  quantity: -quantityToReduce,
                  action: "remove-stock",
                  timestamp: new Date(),
                  orderNo: order.orderNo,
                  userId: createdBy,
                },
              },
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error(
            `Failed to log inventory history for ${productId}:`,
            err
          );
          // Don't fail the order — just log
        }

        // 3. Update product status
        let newStatus = "active";
        if (newQuantity === 0) newStatus = "out_of_stock";
        else if (
          productRecord.alert_quantity &&
          newQuantity <= productRecord.alert_quantity
        )
          newStatus = "low_stock";

        if (newStatus !== productRecord.status) {
          await Product.update({ status: newStatus }, { where: { productId } });
        }

        // 4. Notify admin
        if (newStatus === "out_of_stock" || newStatus === "low_stock") {
          await sendNotification({
            userId: ADMIN_USER_ID,
            title: `Product ${newStatus.replace("_", " ")}`,
            message: `Product ${productRecord.name} is now ${newStatus.replace(
              "_",
              " "
            )} (Qty: ${newQuantity})`,
          });
        }
      }
    }

    // Send notification to creator, assignedUserId, and secondaryUserId
    const recipients = new Set(
      [createdBy, assignedUserId, secondaryUserId].filter((id) => id)
    );
    const addressInfo =
      shipTo && addressDetails
        ? `, to be shipped to ${
            addressDetails.address || "address ID " + shipTo
          }`
        : "";
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `New Order Created #${orderNo}`,
        message: `Order #${orderNo} has been created for ${customer.name}${addressInfo}.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New Order Created #${orderNo}`,
      message: `Order #${orderNo} created for ${customer.name} by ${user.name}${addressInfo}.`,
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
          message: `Order #${orderNo} has been assigned to your team for ${customer.name}${addressInfo}.`,
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
        {
          model: Address,
          as: "shippingAddress", // Alias for the association
          attributes: ["addressId"], // Adjust attributes as needed
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
  const { id } = req.params;

  try {
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
        {
          model: Address,
          as: "shippingAddress",
          attributes: ["addressId"],
        },
        {
          model: Quotation,
          as: "quotation",
          attributes: [
            "quotationId",
            "document_title",
            "quotation_date",
            "due_date",
            "followupDates",
            "reference_number",
            "products",
            "discountAmount",
            "roundOff",
            "finalAmount",
            "signature_name",
            "signature_image",
            "createdBy",
            "customerId",
            "shipTo",
          ],
        },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, `Order with ID ${id} not found`);
    }

    const { comments } = await fetchCommentsWithUsers(id, "Order", 1, 10);
    let orderWithDetails = order.toJSON();

    if (order.quotationId && order.quotation) {
      try {
        let quotationProducts = order.quotation.products || [];
        if (typeof quotationProducts === "string") {
          try {
            quotationProducts = JSON.parse(quotationProducts);
          } catch (parseErr) {
            console.error(
              `Error parsing quotation products for order ${id}:`,
              parseErr
            );
            quotationProducts = [];
          }
        }

        if (!Array.isArray(quotationProducts)) {
          console.warn(`Quotation products for order ${id} is not an array`);
          quotationProducts = [];
        }

        const productIds = quotationProducts
          .map((item) => item.productId)
          .filter((id) => id);

        const products = productIds.length
          ? await Product.findAll({
              where: { productId: productIds }, // FIXED
              attributes: [
                "productId",
                "name",
                "description",
                "discountType",
                "meta",
              ],
            })
          : [];

        const productMap = products.reduce((map, product) => {
          map[product.productId] = product.toJSON();
          return map;
        }, {});

        const enrichedProducts = quotationProducts.map((item) => {
          const product = productMap[item.productId] || {};
          const sellingPrice =
            product.meta && product.meta["9ba862ef-f993-4873-95ef-1fef10036aa5"]
              ? product.meta["9ba862ef-f993-4873-95ef-1fef10036aa5"]
              : null;

          return {
            productId: item.productId,
            quantity: item.quantity || 1,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: item.total || 0,
            sellingPrice,
            productDetails: product,
          };
        });

        orderWithDetails.products = enrichedProducts;
        orderWithDetails.quotationDetails = {
          quotationId: order.quotation.quotationId,
          document_title: order.quotation.document_title,
          quotation_date: order.quotation.quotation_date,
          due_date: order.quotation.due_date,
          followupDates: order.quotation.followupDates,
          reference_number: order.quotation.reference_number,
          discountAmount: order.quotation.discountAmount || 0,
          roundOff: order.quotation.roundOff || 0,
          finalAmount: order.quotation.finalAmount || 0,
          signature_name: order.quotation.signature_name,
          signature_image: order.quotation.signature_image,
          createdBy: order.quotation.createdBy,
          customerId: order.quotation.customerId,
          shipTo: order.quotation.shipTo,
          status: order.quotation.status,
        };
      } catch (err) {
        console.error(`Error processing quotation for order ${id}:`, err);
        orderWithDetails.products = [];
        orderWithDetails.quotationDetails = null;
      }
    } else if (order.products && Array.isArray(order.products)) {
      const productIds = order.products
        .map((item) => item.id)
        .filter((id) => id);

      const products = productIds.length
        ? await Product.findAll({
            where: { productId: productIds }, // FIXED
            attributes: ["productId", "name", "discountType", "meta"],
          })
        : [];

      const productMap = products.reduce((map, product) => {
        map[product.productId] = product.toJSON();
        return map;
      }, {});

      const enrichedProducts = order.products.map((item) => {
        const product = productMap[item.id] || {};
        const sellingPrice =
          product.meta && product.meta["9ba862ef-f993-4873-95ef-1fef10036aa5"]
            ? product.meta["9ba862ef-f993-4873-95ef-1fef10036aa5"]
            : null;

        return {
          productId: item.id,
          quantity: item.quantity || 1,
          price: item.price || 0,
          discount: item.discount || 0,
          total: item.total || item.price * (item.quantity || 1),
          sellingPrice,
          productDetails: product,
        };
      });

      orderWithDetails.products = enrichedProducts;
    } else {
      orderWithDetails.products = [];
    }

    orderWithDetails.comments = comments;

    return res.status(200).json({ order: orderWithDetails });
  } catch (err) {
    console.error(
      `Error fetching order details for order ${req.params.id}:`,
      err
    );
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

    // Delete associated comments (Mongoose)
    await Comment.deleteMany({ resourceId: id, resourceType: "Order" });

    // Delete associated OrderItems (Mongoose)
    await OrderItem.deleteMany({ orderId: id });

    // Delete the order (Sequelize)
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
        {
          model: Address,
          as: "shippingAddress",
          attributes: ["addressId"],
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

    // Validate shipTo if provided
    let addressDetails = null;
    if (updates.shipTo !== undefined) {
      if (updates.shipTo === null || updates.shipTo === "") {
        updates.shipTo = null;
      } else {
        const address = await Address.findByPk(updates.shipTo);
        if (!address) {
          return res
            .status(404)
            .json({ message: `Address with ID ${updates.shipTo} not found` });
        }
        addressDetails = address.toJSON(); // Store for notification
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
    const addressInfo =
      updates.shipTo !== undefined && addressDetails
        ? `, shipping updated to ${
            addressDetails.address || "address ID " + updates.shipTo
          }`
        : updates.shipTo === null
        ? ", shipping address removed"
        : "";
    for (const recipientId of recipients) {
      await sendNotification({
        userId: recipientId,
        title: `Order Updated #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${
          customer?.name || "Customer"
        } has been updated${addressInfo}.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Updated #${order.orderNo}`,
      message: `Order #${order.orderNo} for ${
        customer?.name || "Customer"
      } has been updated${addressInfo}.`,
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
          }${addressInfo}.`,
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
      shipTo, // Add shipTo
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

    // Validate shipTo if provided
    let addressDetails = null;
    if (shipTo) {
      const address = await Address.findByPk(shipTo);
      if (!address) {
        return sendErrorResponse(
          res,
          404,
          `Address with ID ${shipTo} not found`
        );
      }
      addressDetails = address.toJSON();
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
      shipTo, // Include shipTo
    });

    // Send notification to admin
    const addressInfo =
      shipTo && addressDetails
        ? `, to be shipped to ${
            addressDetails.address || "address ID " + shipTo
          }`
        : "";
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Draft Order Created #${orderNo}`,
      message: `A draft order #${orderNo} has been created${addressInfo}.`,
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
        message: `Draft order #${orderNo} has been assigned to your team${addressInfo}.`,
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
      shipTo, // Add shipTo filter
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

    if (shipTo) {
      const address = await Address.findByPk(shipTo);
      if (!address) {
        return sendErrorResponse(
          res,
          404,
          `Address with ID ${shipTo} not found`
        );
      }
      filters.shipTo = shipTo;
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
      {
        model: Address,
        as: "shippingAddress",
        attributes: ["addressId"],
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

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Address,
          as: "shippingAddress",
          attributes: ["addressId"],
        },
      ],
    });
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
    const addressInfo =
      order.shipTo && order.shipToAddress
        ? `, to be shipped to ${
            order.shipToAddress.address || "address ID " + order.shipTo
          }`
        : "";

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
        }${addressInfo} has been updated.`,
      });
    }

    // Send notification to admin
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Team Updated #${order.orderNo}`,
      message: `The team for order #${order.orderNo} for ${
        customer?.name || "Customer"
      }${addressInfo} has been updated.`,
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
          }${addressInfo}.`,
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
