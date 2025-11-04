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
// ──────── HELPERS ────────
const VALID_STATUSES = [
  "PREPARING",
  "CHECKING",
  "INVOICE",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
  "CANCELED",
  "DRAFT",
  "ONHOLD",
  "CLOSED", // ← NEW
];
const VALID_PRIORITIES = ["high", "medium", "low"];

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

/**
 * Compute totals (GST, extra discount, final amount, amountPaid validation)
 * @returns {{gstValue, extraDiscountValue, subTotal, finalTotal}}
 */
function computeTotals({
  products = [],
  shipping = 0,
  gst = 0,
  extraDiscount = 0,
  extraDiscountType = "fixed",
  amountPaid = 0,
}) {
  // 1. Sub-total (price * qty after line-discount)
  const subTotal = products.reduce((sum, p) => sum + (p.total ?? 0), 0);

  // 2. Shipping
  const totalWithShipping = subTotal + Number(shipping);

  // 3. GST
  const gstValue = (totalWithShipping * Number(gst)) / 100;

  // 4. Extra discount
  let extraDiscountValue = 0;
  if (extraDiscount > 0) {
    extraDiscountValue =
      extraDiscountType === "percent"
        ? (totalWithShipping * Number(extraDiscount)) / 100
        : Number(extraDiscount);
  }

  // 5. **FINAL AMOUNT**
  const finalAmount = totalWithShipping + gstValue - extraDiscountValue;

  // // 6. amountPaid must not exceed final amount
  // if (Number(amountPaid) > finalAmount + 0.01) {
  //   throw new Error(
  //     `amountPaid (${amountPaid}) cannot exceed final amount (${finalAmount.toFixed(
  //       2
  //     )})`
  //   );
  // }

  return {
    subTotal,
    totalWithShipping,
    gstValue,
    extraDiscountValue,
    finalAmount, // <-- NEW
  };
}

/**
 * Reduce stock + log history (shared by create & update when products change)
 */
async function reduceStockAndLog({
  productUpdates,
  createdBy,
  orderNo,
  customMessage,
}) {
  const username = (
    await User.findByPk(createdBy, { attributes: ["username"] })
  ).username;
  const autoMsg = `Stock removed by ${username} (Order #${orderNo})`;
  const msg = customMessage?.trim() || autoMsg;

  for (const upd of productUpdates) {
    const { productId, quantityToReduce, productRecord } = upd;

    // ---- update qty
    const newQty = productRecord.quantity - quantityToReduce;
    await Product.update({ quantity: newQty }, { where: { productId } });

    // ---- mongo history
    try {
      await InventoryHistory.findOneAndUpdate(
        { productId },
        {
          $push: {
            history: {
              quantity: -quantityToReduce,
              action: "remove-stock",
              timestamp: new Date(),
              orderNo,
              userId: createdBy,
              message: msg,
            },
          },
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.error(`InventoryHistory error (pid ${productId}):`, e);
    }

    // ---- status
    let newStatus = "active";
    if (newQty === 0) newStatus = "out_of_stock";
    else if (
      productRecord.alert_quantity &&
      newQty <= productRecord.alert_quantity
    )
      newStatus = "low_stock";

    if (newStatus !== productRecord.status) {
      await Product.update({ status: newStatus }, { where: { productId } });
    }

    // ---- low / out-of-stock admin notification
    if (["out_of_stock", "low_stock"].includes(newStatus)) {
      await sendNotification({
        userId: ADMIN_USER_ID,
        title: `Product ${newStatus.replace("_", " ")}`,
        message: `Product ${productRecord.name} is now ${newStatus.replace(
          "_",
          " "
        )} (Qty: ${newQty})`,
      });
    }
  }
}

/**
 * Re-add stock when order is canceled / deleted
 */
async function restoreStock({ products, orderNo }) {
  if (!products?.length) return;

  for (const p of products) {
    const prod = await Product.findByPk(p.id);
    if (!prod) continue;

    const newQty = prod.quantity + (p.quantity ?? 0);
    await Product.update({ quantity: newQty }, { where: { productId: p.id } });

    // optional mongo log
    try {
      await InventoryHistory.findOneAndUpdate(
        { productId: p.id },
        {
          $push: {
            history: {
              quantity: p.quantity,
              action: "add-stock",
              timestamp: new Date(),
              orderNo,
              message: `Stock restored (order ${orderNo} cancelled/deleted)`,
            },
          },
        },
        { upsert: true }
      );
    } catch (e) {
      console.error(e);
    }
  }
}

// ──────── CREATE ORDER ────────
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
      shipping,
      message: customMessage,
      gst = 0,
      extraDiscount = 0,
      extraDiscountType = "fixed",
      amountPaid = 0, // ← NEW
    } = req.body;

    // ── BASIC REQUIRED ──
    if (!createdFor || !createdBy || !orderNo) {
      return sendErrorResponse(
        res,
        400,
        "createdFor, createdBy, and orderNo are required"
      );
    }

    // ── SHIPPING ──
    const parsedShipping = shipping == null ? 0 : parseFloat(shipping);
    if (isNaN(parsedShipping) || parsedShipping < 0) {
      return sendErrorResponse(res, 400, "Invalid shipping amount");
    }

    // ── USER / CUSTOMER ──
    const [creator, customer] = await Promise.all([
      User.findByPk(createdBy, { attributes: ["username", "name"] }),
      Customer.findByPk(createdFor),
    ]);
    if (!creator) return sendErrorResponse(res, 404, "Creator user not found");
    if (!customer) return sendErrorResponse(res, 404, "Customer not found");

    // ── QUOTATION (optional) ──
    if (quotationId) {
      const q = await Quotation.findByPk(quotationId);
      if (!q) return sendErrorResponse(res, 404, "Quotation not found");
    }

    // ── MASTER / PREVIOUS (optional) ──
    if (masterPipelineNo) {
      const m = await Order.findOne({ where: { orderNo: masterPipelineNo } });
      if (!m)
        return sendErrorResponse(
          res,
          404,
          `Master order ${masterPipelineNo} not found`
        );
      if (masterPipelineNo === orderNo)
        return sendErrorResponse(
          res,
          400,
          "Master pipeline cannot equal orderNo"
        );
    }
    if (previousOrderNo) {
      const p = await Order.findOne({ where: { orderNo: previousOrderNo } });
      if (!p)
        return sendErrorResponse(
          res,
          404,
          `Previous order ${previousOrderNo} not found`
        );
      if (previousOrderNo === orderNo)
        return sendErrorResponse(
          res,
          400,
          "Previous order cannot equal orderNo"
        );
    }

    // ── PRODUCTS ──
    let productUpdates = [];
    if (products) {
      if (!Array.isArray(products) || !products.length) {
        return sendErrorResponse(
          res,
          400,
          "Products must be a non-empty array"
        );
      }

      for (const p of products) {
        const { id, price, discount, total, quantity } = p;
        if (
          !id ||
          price == null ||
          discount == null ||
          total == null ||
          quantity == null ||
          quantity < 1
        ) {
          return sendErrorResponse(
            res,
            400,
            "Each product needs id, price, discount, total, quantity (>=1)"
          );
        }

        const prod = await Product.findByPk(id);
        if (!prod)
          return sendErrorResponse(res, 404, `Product ${id} not found`);

        // numeric checks
        if (
          typeof price !== "number" ||
          price < 0 ||
          typeof discount !== "number" ||
          discount < 0 ||
          typeof total !== "number" ||
          total < 0
        ) {
          return sendErrorResponse(res, 400, `Invalid numeric field for ${id}`);
        }

        // line-total validation
        const discType = prod.discountType || "fixed";
        const expected = Number(
          (
            (discType === "percent"
              ? price * (1 - discount / 100)
              : price - discount) * quantity
          ).toFixed(2)
        );

        if (Math.abs(total - expected) > 0.01) {
          return sendErrorResponse(
            res,
            400,
            `Invalid total for ${id}. Expected ${expected}`
          );
        }

        // stock check
        if (prod.quantity < quantity) {
          return sendErrorResponse(
            res,
            400,
            `Insufficient stock for ${id}. Have ${prod.quantity}, need ${quantity}`
          );
        }

        productUpdates.push({
          productId: id,
          quantityToReduce: quantity,
          productRecord: prod,
        });
      }
    }

    // ── DATES ──
    if (dueDate && new Date(dueDate).toString() === "Invalid Date") {
      return sendErrorResponse(res, 400, "Invalid dueDate");
    }
    const parsedFollowup = Array.isArray(followupDates)
      ? followupDates.filter(
          (d) => d && new Date(d).toString() !== "Invalid Date"
        )
      : [];

    // ── TEAM / USERS ──
    if (assignedTeamId) {
      const t = await Team.findByPk(assignedTeamId);
      if (!t) return sendErrorResponse(res, 400, "Assigned team not found");
    }
    if (assignedUserId) {
      const u = await User.findByPk(assignedUserId);
      if (!u) return sendErrorResponse(res, 400, "Assigned user not found");
    }
    if (secondaryUserId != null && secondaryUserId !== "") {
      const u = await User.findByPk(secondaryUserId);
      if (!u) return sendErrorResponse(res, 400, "Secondary user not found");
    } else {
      secondaryUserId = null; // ensure clean null
    }

    // ── ORDERNO UNIQUENESS ──
    if (isNaN(parseInt(orderNo))) {
      return sendErrorResponse(res, 400, "orderNo must be numeric");
    }
    const existing = await Order.findOne({
      where: { orderNo: parseInt(orderNo) },
    });
    if (existing) return sendErrorResponse(res, 400, "orderNo already used");

    // ── SHIPTO ──
    let addressDetails = null;
    if (shipTo) {
      const a = await Address.findByPk(shipTo);
      if (!a) return sendErrorResponse(res, 404, `Address ${shipTo} not found`);
      addressDetails = a.toJSON();
    }

    // ── PRIORITY ──
    const prio = priority ? priority.toLowerCase() : "medium";
    if (!VALID_PRIORITIES.includes(prio)) {
      return sendErrorResponse(res, 400, `Invalid priority: ${priority}`);
    }

    // ── STATUS ──
    const normalizedStatus = status ? status.toUpperCase() : "PREPARING";
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return sendErrorResponse(res, 400, `Invalid status: ${status}`);
    }
    // GST
    const parsedGst = gst != null && gst !== "" ? parseFloat(gst) : null;
    if (
      parsedGst !== null &&
      (isNaN(parsedGst) || parsedGst < 0 || parsedGst > 100)
    ) {
      return sendErrorResponse(res, 400, "Invalid GST %");
    }
    // Amount Paid
    const parsedAmountPaid =
      amountPaid != null && amountPaid !== "" ? parseFloat(amountPaid) : 0;
    if (isNaN(parsedAmountPaid) || parsedAmountPaid < 0) {
      return sendErrorResponse(res, 400, "Invalid amountPaid");
    }

    // Extra Discount
    const parsedExtra =
      extraDiscount != null && extraDiscount !== ""
        ? parseFloat(extraDiscount)
        : null;
    if (parsedExtra !== null && (isNaN(parsedExtra) || parsedExtra < 0)) {
      return sendErrorResponse(res, 400, "Invalid extraDiscount");
    }

    // Type
    const discountType = parsedExtra != null ? extraDiscountType : null;
    if (parsedExtra != null && !["percent", "fixed"].includes(discountType)) {
      return sendErrorResponse(res, 400, "Invalid extraDiscountType");
    }
    // ---- compute totals (throws if amountPaid > final)
    const { gstValue, extraDiscountValue, finalAmount } = computeTotals({
      products,
      shipping: parsedShipping,
      gst: parsedGst,
      extraDiscount: parsedExtra,
      extraDiscountType,
      amountPaid: parsedAmountPaid,
    });

    // ── CREATE ORDER ──
    const order = await Order.create({
      createdFor,
      createdBy,
      status: normalizedStatus,
      dueDate,
      assignedTeamId,
      assignedUserId,
      secondaryUserId,
      followupDates: parsedFollowup,
      source,
      priority: prio,
      description,
      orderNo: parseInt(orderNo),
      quotationId,
      products,
      masterPipelineNo,
      previousOrderNo,
      shipTo,
      shipping: parsedShipping,
      gst: parsedGst,
      gstValue,
      extraDiscount: parsedExtra,
      extraDiscountType,
      extraDiscountValue,
      amountPaid: parsedAmountPaid,
      finalAmount,
    });

    // ── STOCK REDUCTION ──
    if (productUpdates.length) {
      await reduceStockAndLog({
        productUpdates,
        createdBy,
        orderNo: order.orderNo,
        customMessage,
      });
    }

    // ── NOTIFICATIONS ──
    const recipients = new Set(
      [createdBy, assignedUserId, secondaryUserId].filter(Boolean)
    );
    const addrInfo =
      shipTo && addressDetails
        ? `, ship to ${addressDetails.address || "address ID " + shipTo}`
        : "";

    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `New Order #${orderNo}`,
        message: `Order #${orderNo} for ${customer.name}${addrInfo}.`,
      });
    }
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New Order #${orderNo}`,
      message: `Order #${orderNo} created by ${creator.name} for ${customer.name}${addrInfo}.`,
    });

    if (assignedTeamId) {
      const members = await User.findAll({
        include: [{ model: Team, as: "teams", where: { id: assignedTeamId } }],
        attributes: ["userId", "name"],
      });
      for (const m of members) {
        await sendNotification({
          userId: m.userId,
          title: `Order Assigned to Team #${orderNo}`,
          message: `Order #${orderNo} assigned to your team for ${customer.name}${addrInfo}.`,
        });
      }
    }

    return res
      .status(201)
      .json({ message: "Order created", id: order.id, orderNo: order.orderNo });
  } catch (err) {
    console.error(err);
    return sendErrorResponse(res, 500, "Failed to create order", err.message);
  }
};

// ──────── UPDATE ORDER (by id) ────────
exports.updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const order = await Order.findByPk(id, {
      include: [
        { model: Customer, as: "customer" },
        { model: Address, as: "shippingAddress" },
      ],
    });
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    // ── STATUS ──
    if (updates.status) {
      const norm = updates.status.toUpperCase();
      if (!VALID_STATUSES.includes(norm))
        return sendErrorResponse(res, 400, `Invalid status: ${updates.status}`);
      updates.status = norm;
    }

    // ── PRIORITY ──
    if (updates.priority) {
      const p = updates.priority.toLowerCase();
      if (!VALID_PRIORITIES.includes(p))
        return sendErrorResponse(
          res,
          400,
          `Invalid priority: ${updates.priority}`
        );
      updates.priority = p;
    }

    // ── DATES ──
    if (updates.dueDate) {
      if (!moment(updates.dueDate, "YYYY-MM-DD", true).isValid())
        return sendErrorResponse(res, 400, "Invalid dueDate");
      updates.dueDate = moment(updates.dueDate).format("YYYY-MM-DD");
    }
    if (updates.followupDates) {
      if (!Array.isArray(updates.followupDates))
        return sendErrorResponse(res, 400, "followupDates must be array");
      const bad = updates.followupDates.filter(
        (d) => d && !moment(d, "YYYY-MM-DD", true).isValid()
      );
      if (bad.length)
        return sendErrorResponse(res, 400, "Invalid followup date format");
      updates.followupDates = updates.followupDates.filter(Boolean);
    }

    // ── TEAM / USERS ──
    if (updates.assignedTeamId) {
      const t = await Team.findByPk(updates.assignedTeamId);
      if (!t) return sendErrorResponse(res, 400, "Assigned team not found");
    }
    if (updates.assignedUserId) {
      const u = await User.findByPk(updates.assignedUserId);
      if (!u) return sendErrorResponse(res, 400, "Assigned user not found");
    }
    if (updates.secondaryUserId) {
      const u = await User.findByPk(updates.secondaryUserId);
      if (!u) return sendErrorResponse(res, 400, "Secondary user not found");
    }

    // ── ORDERNO (unique except self) ──
    if (updates.orderNo !== undefined) {
      if (!updates.orderNo)
        return sendErrorResponse(res, 400, "orderNo required");
      const n = parseInt(updates.orderNo);
      if (isNaN(n))
        return sendErrorResponse(res, 400, "orderNo must be numeric");
      const conflict = await Order.findOne({
        where: { orderNo: n, id: { [Op.ne]: id } },
      });
      if (conflict)
        return sendErrorResponse(res, 400, "orderNo already exists");
      updates.orderNo = n;
    }

    // ── MASTER / PREVIOUS ──
    if (updates.masterPipelineNo !== undefined) {
      if (updates.masterPipelineNo === null) updates.masterPipelineNo = null;
      else {
        const m = await Order.findOne({
          where: { orderNo: updates.masterPipelineNo },
        });
        if (!m)
          return sendErrorResponse(
            res,
            404,
            `Master order ${updates.masterPipelineNo} not found`
          );
        if (updates.masterPipelineNo == order.orderNo)
          return sendErrorResponse(
            res,
            400,
            "Master cannot be same as orderNo"
          );
      }
    }
    if (updates.previousOrderNo !== undefined) {
      if (updates.previousOrderNo === null) updates.previousOrderNo = null;
      else {
        const p = await Order.findOne({
          where: { orderNo: updates.previousOrderNo },
        });
        if (!p)
          return sendErrorResponse(
            res,
            404,
            `Previous order ${updates.previousOrderNo} not found`
          );
        if (updates.previousOrderNo == order.orderNo)
          return sendErrorResponse(
            res,
            400,
            "Previous cannot be same as orderNo"
          );
      }
    }

    // ── QUOTATION ──
    if (updates.quotationId !== undefined) {
      if (updates.quotationId === null) updates.quotationId = null;
      else {
        const q = await Quotation.findByPk(updates.quotationId);
        if (!q) return sendErrorResponse(res, 404, "Quotation not found");
      }
    }

    // ── PRODUCTS (full replace) ──
    let newProductUpdates = [];
    if (updates.products !== undefined) {
      if (updates.products === null) updates.products = null;
      else if (!Array.isArray(updates.products))
        return sendErrorResponse(res, 400, "products must be array");

      for (const p of updates.products) {
        const { id, price, discount, total, quantity } = p;
        if (
          !id ||
          price == null ||
          discount == null ||
          total == null ||
          quantity == null ||
          quantity < 1
        )
          return sendErrorResponse(
            res,
            400,
            "Each product needs id,price,discount,total,quantity"
          );

        const prod = await Product.findByPk(id);
        if (!prod)
          return sendErrorResponse(res, 404, `Product ${id} not found`);

        // numeric sanity
        if (
          typeof price !== "number" ||
          price < 0 ||
          typeof discount !== "number" ||
          discount < 0 ||
          typeof total !== "number" ||
          total < 0
        )
          return sendErrorResponse(res, 400, `Invalid numeric for ${id}`);

        // line total
        const discType = prod.discountType || "fixed";
        const expected = Number(
          (
            (discType === "percent"
              ? price * (1 - discount / 100)
              : price - discount) * quantity
          ).toFixed(2)
        );

        if (Math.abs(total - expected) > 0.01) {
          return sendErrorResponse(
            res,
            400,
            `Invalid total for ${id}. Expected ${expected}`
          );
        }
        // stock (only check – we will adjust later)
        if (
          prod.quantity +
            (order.products?.find((op) => op.id == id)?.quantity || 0) <
          quantity
        ) {
          return sendErrorResponse(res, 400, `Not enough stock for ${id}`);
        }

        newProductUpdates.push({
          productId: id,
          quantityToReduce: quantity,
          productRecord: prod,
        });
      }
    }

    // ── SHIPPING / GST / EXTRA DISCOUNT / amountPaid ──
    if (updates.shipping !== undefined) {
      const s = parseFloat(updates.shipping);
      if (isNaN(s) || s < 0)
        return sendErrorResponse(res, 400, "Invalid shipping");
      updates.shipping = s;
    }
    if (updates.gst !== undefined) {
      const g = parseFloat(updates.gst);
      if (isNaN(g) || g < 0 || g > 100)
        return sendErrorResponse(res, 400, "Invalid GST %");
      updates.gst = g;
    }
    if (updates.extraDiscount !== undefined) {
      const d = parseFloat(updates.extraDiscount);
      if (isNaN(d) || d < 0)
        return sendErrorResponse(res, 400, "Invalid extraDiscount");
      updates.extraDiscount = d;
    }
    if (updates.extraDiscountType !== undefined) {
      if (!["percent", "fixed"].includes(updates.extraDiscountType))
        return sendErrorResponse(res, 400, "Invalid extraDiscountType");
    }
    if (updates.amountPaid !== undefined) {
      const a = parseFloat(updates.amountPaid);
      if (isNaN(a) || a < 0)
        return sendErrorResponse(res, 400, "Invalid amountPaid");
      updates.amountPaid = a;
    }

    // ── RECALCULATE TOTALS BEFORE SAVE ──
    const calcInput = {
      products: updates.products ?? order.products ?? [],
      shipping: updates.shipping ?? order.shipping ?? 0,
      gst: updates.gst ?? order.gst ?? 0,
      extraDiscount: updates.extraDiscount ?? order.extraDiscount ?? 0,
      extraDiscountType:
        updates.extraDiscountType ?? order.extraDiscountType ?? "fixed",
      amountPaid: updates.amountPaid ?? order.amountPaid ?? 0,
    };
    // inside updateOrderById, after computeTotals()
    const {
      gstValue,
      extraDiscountValue,
      finalAmount, // <-- NEW
    } = computeTotals(calcInput);

    updates.gstValue = gstValue;
    updates.extraDiscountValue = extraDiscountValue;
    updates.finalAmount = finalAmount; // <-- NEW
    // ── STOCK ADJUSTMENT (if products changed) ──
    if (newProductUpdates.length) {
      // 1. restore old quantities
      if (order.products?.length) {
        await restoreStock({
          products: order.products,
          orderNo: order.orderNo,
        });
      }
      // 2. deduct new quantities
      await reduceStockAndLog({
        productUpdates: newProductUpdates,
        createdBy: order.createdBy,
        orderNo: order.orderNo,
      });
    }

    // ── SAVE ──
    await order.update(updates);
    await order.reload();

    // ── NOTIFICATIONS ──
    const customer = order.customer;
    const addrInfo =
      order.shipTo && order.shippingAddress
        ? `, ship to ${order.shippingAddress.address || "addr " + order.shipTo}`
        : "";

    const recipients = new Set(
      [
        order.createdBy,
        updates.assignedUserId ?? order.assignedUserId,
        updates.secondaryUserId ?? order.secondaryUserId,
      ].filter(Boolean)
    );
    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Order Updated #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${customer.name}${addrInfo} updated.`,
      });
    }
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Updated #${order.orderNo}`,
      message: `Order #${order.orderNo} for ${customer.name}${addrInfo} updated.`,
    });

    // team change notification
    if (
      updates.assignedTeamId &&
      updates.assignedTeamId !== order.assignedTeamId
    ) {
      const members = await User.findAll({
        include: [
          { model: Team, as: "teams", where: { id: updates.assignedTeamId } },
        ],
        attributes: ["userId", "name"],
      });
      for (const m of members) {
        await sendNotification({
          userId: m.userId,
          title: `Order Assigned to Team #${order.orderNo}`,
          message: `Order #${order.orderNo} assigned to your team for ${customer.name}${addrInfo}.`,
        });
      }
    }

    return res.status(200).json({ message: "Order updated", order });
  } catch (err) {
    console.error(err);
    return sendErrorResponse(res, 500, "Failed to update order", err.message);
  }
};

// ──────── UPDATE STATUS ONLY ────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status)
      return sendErrorResponse(res, 400, "id & status required");

    const order = await Order.findByPk(id, {
      include: [{ model: Customer, as: "customer" }],
    });
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    const norm = status.toUpperCase();
    if (!VALID_STATUSES.includes(norm))
      return sendErrorResponse(res, 400, `Invalid status: ${status}`);

    const old = order.status;
    order.status = norm;
    await order.save();

    // special handling for CANCELED / CLOSED → restore stock
    if (["CANCELED", "CLOSED"].includes(norm) && order.products?.length) {
      await restoreStock({ products: order.products, orderNo: order.orderNo });
    }

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean
      )
    );
    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Order Status #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${
          order.customer?.name || "Customer"
        } → ${norm}.`,
      });
    }
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Status #${order.orderNo}`,
      message: `Order #${order.orderNo} changed ${old} → ${norm}.`,
    });

    return res.status(200).json({ message: "Status updated", order });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to update status", err.message);
  }
};

// ──────── DELETE ORDER ────────
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [{ model: Customer, as: "customer" }],
    });
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    // prevent delete if referenced
    const deps = await Order.findAll({
      where: {
        [Op.or]: [
          { previousOrderNo: order.orderNo },
          { masterPipelineNo: order.orderNo },
        ],
      },
    });
    if (deps.length)
      return sendErrorResponse(
        res,
        400,
        "Order referenced by other orders – cannot delete"
      );

    // restore stock
    if (order.products?.length) {
      await restoreStock({ products: order.products, orderNo: order.orderNo });
    }

    // notifications
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean
      )
    );
    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Order Deleted #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${
          order.customer?.name || "Customer"
        } deleted.`,
      });
    }
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order Deleted #${order.orderNo}`,
      message: `Order #${order.orderNo} deleted.`,
    });

    // mongo clean-up
    await Comment.deleteMany({ resourceId: id, resourceType: "Order" });
    await OrderItem.deleteMany({ orderId: id });

    await order.destroy();
    return res.status(200).json({ message: "Order deleted" });
  } catch (err) {
    return sendErrorResponse(res, 500, "Delete failed", err.message);
  }
};

// ──────── DRAFT ORDER (now also accepts amountPaid) ────────
exports.draftOrder = async (req, res) => {
  try {
    const {
      quotationId,
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
      shipTo,
      amountPaid = 0, // ← NEW
    } = req.body;

    if (!assignedTeamId)
      return sendErrorResponse(res, 400, "assignedTeamId required");

    const team = await Team.findByPk(assignedTeamId);
    if (!team) return sendErrorResponse(res, 400, "Team not found");

    // optional validations (same as create)
    if (quotationId) {
      const q = await Quotation.findByPk(quotationId);
      if (!q) return sendErrorResponse(res, 400, "Quotation not found");
    }
    if (masterPipelineNo) {
      const m = await Order.findOne({ where: { orderNo: masterPipelineNo } });
      if (!m)
        return sendErrorResponse(
          res,
          404,
          `Master order ${masterPipelineNo} not found`
        );
    }
    if (previousOrderNo) {
      const p = await Order.findOne({ where: { orderNo: previousOrderNo } });
      if (!p)
        return sendErrorResponse(
          res,
          404,
          `Previous order ${previousOrderNo} not found`
        );
    }
    if (shipTo) {
      const a = await Address.findByPk(shipTo);
      if (!a) return sendErrorResponse(res, 404, `Address ${shipTo} not found`);
    }

    // product validation (same as create, but **no stock reduction**)
    if (products) {
      if (!Array.isArray(products) || !products.length)
        return sendErrorResponse(res, 400, "products must be non-empty array");
      for (const p of products) {
        const { id, price, discount, total } = p;
        if (!id || price == null || discount == null || total == null)
          return sendErrorResponse(
            res,
            400,
            "Each product needs id,price,discount,total"
          );
        const prod = await Product.findByPk(id);
        if (!prod)
          return sendErrorResponse(res, 404, `Product ${id} not found`);
        // line-total check
        const discType = prod.discountType || "fixed";
        const expected =
          discType === "percent"
            ? price * (1 - discount / 100)
            : price - discount;
        if (Math.abs(total - expected) > 0.01)
          return sendErrorResponse(
            res,
            400,
            `Invalid total for ${id}. Expected ${expected.toFixed(2)}`
          );
      }
    }

    // amountPaid validation (must be 0 for draft – optional)
    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < 0)
      return sendErrorResponse(res, 400, "Invalid amountPaid");
    if (paid > 0)
      return sendErrorResponse(
        res,
        400,
        "amountPaid must be 0 for draft orders"
      );

    // generate orderNo (same pattern as create)
    const today = moment().format("DDMMYYYY");
    const dayCount = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: moment().startOf("day").toDate(),
          [Op.lte]: moment().endOf("day").toDate(),
        },
      },
    });
    const serial = String(dayCount + 1).padStart(5, "0");
    const orderNo = `${today}${serial}`;

    const order = await Order.create({
      quotationId,
      status: "DRAFT",
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
      orderNo: parseInt(orderNo),
      shipTo,
      amountPaid: 0,
    });

    // admin + team notifications
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Draft Order #${orderNo}`,
      message: `Draft order #${orderNo} created.`,
    });
    const members = await User.findAll({
      include: [{ model: Team, as: "teams", where: { id: assignedTeamId } }],
      attributes: ["userId", "name"],
    });
    for (const m of members) {
      await sendNotification({
        userId: m.userId,
        title: `Draft Assigned #${orderNo}`,
        message: `Draft order #${orderNo} assigned to your team.`,
      });
    }

    return res.status(201).json({ message: "Draft created", order });
  } catch (err) {
    return sendErrorResponse(res, 500, "Draft failed", err.message);
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
            quotationProducts = [];
          }
        }

        if (!Array.isArray(quotationProducts)) {
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
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch order details",
      err.message
    );
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
