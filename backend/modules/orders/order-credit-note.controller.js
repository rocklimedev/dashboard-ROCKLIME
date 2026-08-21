// controllers/order-credit-note.controller.js

const {
  Order,
  OrderCreditNote,
  OrderCreditNoteItem,
  Product,
  Customer,
  User,
  InventoryHistory,
} = require("../../models");

const { Op } = require("sequelize");
const { v7: uuidv7 } = require("uuid");

const logActivity = require("../../utils/activityLogger");
const logOrderActivity = require("./order-activity-logger");
const { sendNotification } = require("../engagement/notification.controller");
const { uploadToFtp } = require("../../middleware/upload");

// Assume an admin user ID or system channel for notifications
const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60"; // Replace with actual admin user ID or channel

const sendErrorResponse = (res, status, message, details = null) => {
  const response = { message };
  if (details) response.details = details;
  return res.status(status).json(response);
};

// ============================================================
// HELPERS
// ============================================================

const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

/**
 * Upload a credit note document (buffer, from multer memoryStorage)
 * to FTP and return the public URL. Returns null if no file given.
 *
 * multer is configured with memoryStorage() for the credit-note
 * routes, so req.file only ever has a `buffer` — there is no
 * `.location` / `.url` / `.path` to read off it. This is the one
 * place that actually persists the file and gets back a URL.
 */
const uploadCreditNoteFile = async (file) => {
  if (!file || !file.buffer) return null;

  return uploadToFtp(file.buffer, file.originalname, {
    remoteDir: "/invoice_pdfs",
  });
};

/**
 * Reduce stock + log history (shared by create & update)
 */
async function reduceStockAndLog({
  productUpdates,
  createdBy,
  orderNo,
  customMessage,
  transaction,
}) {
  if (!transaction) throw new Error("Transaction is required");

  const username =
    (
      await User.findByPk(createdBy, {
        attributes: ["username"],
        transaction,
      })
    )?.username || "System";

  const autoMsg = `Stock removed by ${username} (Order #${orderNo})`;
  const msg = customMessage?.trim() ? `${customMessage} (${autoMsg})` : autoMsg;

  for (const upd of productUpdates) {
    const { productId, quantityToReduce, productRecord } = upd;

    if (quantityToReduce <= 0) continue; // safety

    const newQty = productRecord.quantity - quantityToReduce;

    // 1. Update product quantity
    await Product.update(
      { quantity: newQty },
      { where: { productId }, transaction },
    );

    // Inside the loop in reduceStockAndLog:
    await InventoryHistory.create(
      {
        id: uuidv7(), // ← Explicitly set the ID here!
        productId,
        change: -quantityToReduce,
        quantityAfter: newQty,
        action: "sale",
        orderNo: String(orderNo),
        userId: createdBy,
        message: msg,
      },
      { transaction },
    );

    // 3. Update status if needed
    let newStatus = "active";
    if (newQty === 0) {
      newStatus = "out_of_stock";
    } else if (
      productRecord.alert_quantity != null &&
      newQty <= productRecord.alert_quantity
    ) {
      newStatus = "low_stock";
    }

    if (newStatus !== productRecord.status) {
      await Product.update(
        { status: newStatus },
        { where: { productId }, transaction },
      );
    }
  }
}

/**
 * Parse `items` from the request body.
 *
 * Because credit note creation accepts a file upload
 * (multipart/form-data), `items` arrives as a JSON string,
 * not a parsed array. Handle both cases defensively.
 */
const parseItems = (rawItems) => {
  if (Array.isArray(rawItems)) return rawItems;

  if (typeof rawItems === "string") {
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Restore stock when order is canceled / deleted / returned.
 * Must run inside the same transaction as the rest of the write.
 */
async function restoreStock({ products, orderNo, transaction }) {
  if (!products?.length) return;

  for (const p of products) {
    const prod = await Product.findByPk(p.id || p.productId, { transaction });
    if (!prod) continue;

    const qtyToAdd = p.quantity ?? 0;
    const newQty = prod.quantity + qtyToAdd;

    await Product.update(
      { quantity: newQty },
      { where: { productId: prod.productId }, transaction },
    );

    await InventoryHistory.create(
      {
        productId: prod.productId,
        change: qtyToAdd,
        quantityAfter: newQty,
        action: "add-stock",
        orderNo,
        message: `Stock restored (order #${orderNo} credit note issued)`,
      },
      { transaction },
    );
  }
}

/**
 * Build a map:
 *
 * productId -> already returned quantity
 *
 * across all existing (non-canceled) credit notes for an order.
 */
const getReturnedQuantityMap = async (orderId, transaction) => {
  const creditNotes = await OrderCreditNote.findAll({
    where: {
      orderId,
      status: {
        [Op.ne]: "CANCELED",
      },
    },
    include: [
      {
        model: OrderCreditNoteItem,
        as: "items",
      },
    ],
    transaction,
  });

  const returnedMap = {};

  for (const note of creditNotes) {
    for (const item of note.items || []) {
      const productId = item.productId;

      if (!productId) continue;

      returnedMap[productId] =
        (returnedMap[productId] || 0) + Number(item.quantity || 0);
    }
  }

  return returnedMap;
};

/**
 * Get the quantity originally ordered.
 */
const getOrderedQuantityMap = (order) => {
  const map = {};

  for (const product of order.products || []) {
    const productId = product.id || product.productId;

    if (!productId) continue;

    map[productId] = (map[productId] || 0) + Number(product.quantity || 0);
  }

  return map;
};

/**
 * Determine whether the entire order has been returned.
 */
const isOrderFullyReturned = ({ orderedQuantityMap, returnedQuantityMap }) => {
  const productIds = Object.keys(orderedQuantityMap);

  if (productIds.length === 0) {
    return false;
  }

  return productIds.every((productId) => {
    const ordered = Number(orderedQuantityMap[productId] || 0);
    const returned = Number(returnedQuantityMap[productId] || 0);

    return returned >= ordered;
  });
};

/**
 * Find product information inside Order.products.
 */
const getOrderProduct = (order, productId) => {
  return (order.products || []).find(
    (product) => String(product.id || product.productId) === String(productId),
  );
};

// ============================================================
// CREATE CREDIT NOTE
// ============================================================

exports.createOrderCreditNote = async (req, res) => {
  const transaction = await Order.sequelize.transaction();

  try {
    // --------------------------------------------------------
    // orderId comes from the route param (":id" in
    // POST /order/:id/credit-note), NOT the body.
    // --------------------------------------------------------

    const orderId = req.params.id;

    const {
      reason,
      // accept both new and legacy field names from the client
      remarks: remarksRaw,
      notes: notesLegacy,
      creditNoteNumber: creditNoteNumberRaw,
      creditNoteNo: creditNoteNoLegacy,
    } = req.body;

    const remarks = remarksRaw ?? notesLegacy ?? null;
    let finalCreditNoteNumber = creditNoteNumberRaw || creditNoteNoLegacy;

    const items = parseItems(req.body.items);

    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (!orderId) {
      await transaction.rollback();
      return sendErrorResponse(res, 400, "orderId is required");
    }

    if (!items || items.length === 0) {
      await transaction.rollback();
      return sendErrorResponse(
        res,
        400,
        "At least one return item is required",
      );
    }

    if (!req.file) {
      await transaction.rollback();
      return sendErrorResponse(res, 400, "Credit note document is required");
    }

    // --------------------------------------------------------
    // UPLOAD CREDIT NOTE DOCUMENT
    // --------------------------------------------------------
    //
    // Done up front, before any row locks are taken below, so a
    // slow FTP round-trip doesn't hold the order/product locks
    // open any longer than necessary.
    // --------------------------------------------------------

    let creditNoteLink;

    try {
      creditNoteLink = await uploadCreditNoteFile(req.file);
    } catch (uploadErr) {
      await transaction.rollback();
      console.error("Credit note file upload failed:", uploadErr);
      return sendErrorResponse(
        res,
        500,
        "Failed to upload credit note document",
        uploadErr.message,
      );
    }

    if (!creditNoteLink) {
      await transaction.rollback();
      return sendErrorResponse(res, 500, "File upload did not return a URL");
    }

    // --------------------------------------------------------
    // OPTIONAL: lock/statement timeout so a stuck transaction
    // fails fast instead of hanging indefinitely on a row lock.
    // Adjust/remove based on your DB dialect if this errors out
    // in your environment (Postgres syntax shown; no-op-safe to
    // wrap in try/catch since it's a defensive guard only).
    // --------------------------------------------------------

    try {
      await transaction.sequelize.query("SET LOCAL lock_timeout = '10s'", {
        transaction,
      });
    } catch (_) {
      // Non-Postgres dialects (or restricted permissions) may reject
      // this; it's a best-effort safety net, not a hard requirement.
    }

    // --------------------------------------------------------
    // FIND ORDER
    // --------------------------------------------------------

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Customer,
          as: "customer",
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return sendErrorResponse(res, 404, "Order not found");
    }

    // --------------------------------------------------------
    // ORDER RETURN VALIDATION
    // --------------------------------------------------------

    const allowedStatuses = ["DELIVERED", "PARTIALLY_DELIVERED", "RETURNED"];

    if (!allowedStatuses.includes(order.status)) {
      await transaction.rollback();
      return sendErrorResponse(
        res,
        400,
        `Credit note cannot be created for order in ${order.status} status`,
      );
    }

    if (!order.products || !Array.isArray(order.products)) {
      await transaction.rollback();
      return sendErrorResponse(res, 400, "Order has no products to return");
    }

    // --------------------------------------------------------
    // CREDIT NOTE NUMBER
    // --------------------------------------------------------

    if (finalCreditNoteNumber) {
      const existing = await OrderCreditNote.findOne({
        where: {
          creditNoteNumber: finalCreditNoteNumber,
        },
        transaction,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(res, 400, "Credit note number already exists");
      }
    } else {
      finalCreditNoteNumber = `CN-${order.orderNo}-${Date.now()}`;
    }

    // --------------------------------------------------------
    // EXISTING RETURNED QUANTITIES
    // --------------------------------------------------------

    const returnedQuantityMap = await getReturnedQuantityMap(
      order.id,
      transaction,
    );

    // --------------------------------------------------------
    // ORDERED QUANTITIES
    // --------------------------------------------------------

    const orderedQuantityMap = getOrderedQuantityMap(order);

    // --------------------------------------------------------
    // PREVENT DUPLICATE PRODUCT LINES
    // --------------------------------------------------------

    const requestedProductIds = new Set();

    // --------------------------------------------------------
    // VALIDATE RETURN ITEMS
    // --------------------------------------------------------
    //
    // IMPORTANT: iterate in a stable, sorted order (by productId)
    // rather than whatever order the client sent them in. Two
    // concurrent requests touching overlapping products but with
    // items in different orders can otherwise lock rows in
    // inconsistent sequence and deadlock, which shows up to the
    // client as a hung request until the DB's lock/deadlock
    // timeout kicks in.
    // --------------------------------------------------------

    const sortedItems = [...items].sort((a, b) =>
      String(a.productId || a.id).localeCompare(String(b.productId || b.id)),
    );

    const validatedItems = [];

    for (const item of sortedItems) {
      const productId = item.productId || item.id;
      const quantity = Number(item.quantity);

      if (!productId) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          400,
          "Each return item requires productId",
        );
      }

      if (requestedProductIds.has(String(productId))) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          400,
          `Duplicate product in credit note: ${productId}`,
        );
      }

      requestedProductIds.add(String(productId));

      if (!Number.isFinite(quantity) || quantity <= 0) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          400,
          `Invalid return quantity for product ${productId}`,
        );
      }

      if (!orderedQuantityMap[productId]) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          400,
          `Product ${productId} does not belong to this order`,
        );
      }

      const alreadyReturned = Number(returnedQuantityMap[productId] || 0);
      const orderedQuantity = Number(orderedQuantityMap[productId] || 0);
      const remainingReturnable = orderedQuantity - alreadyReturned;

      if (quantity > remainingReturnable) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          400,
          `Cannot return ${quantity} of product ${productId}. Only ${remainingReturnable} remaining quantity is returnable.`,
        );
      }

      // ------------------------------------------------------
      // PRODUCT
      // ------------------------------------------------------

      const product = await Product.findByPk(productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product) {
        await transaction.rollback();
        return sendErrorResponse(res, 404, `Product not found: ${productId}`);
      }

      // ------------------------------------------------------
      // ORIGINAL ORDER LINE
      // ------------------------------------------------------

      const orderProduct = getOrderProduct(order, productId);

      if (!orderProduct) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          400,
          `Product ${productId} is not present in the order`,
        );
      }

      const price = Number(item.price ?? orderProduct.price ?? 0);
      const discount = Number(item.discount ?? orderProduct.discount ?? 0);
      const discountType =
        item.discountType || orderProduct.discountType || "percent";
      const tax = Number(item.tax ?? orderProduct.tax ?? 0);

      let unitNetPrice = price;

      if (discountType === "percent") {
        unitNetPrice = price * (1 - discount / 100);
      } else {
        unitNetPrice = price - discount;
      }

      if (unitNetPrice < 0) {
        unitNetPrice = 0;
      }

      const lineTotal = roundMoney(unitNetPrice * quantity);

      validatedItems.push({
        productId,
        productCode: orderProduct.productCode || product.productCode || null,
        name: orderProduct.name || product.name || "Unknown Product",
        quantity,
        price,
        discount,
        discountType,
        tax,
        total: lineTotal,
        reason: item.reason || null,
        productRecord: product,
      });
    }

    // --------------------------------------------------------
    // TOTAL CREDIT VALUE / QUANTITY
    // --------------------------------------------------------

    const creditAmount = roundMoney(
      validatedItems.reduce((sum, item) => sum + Number(item.total || 0), 0),
    );

    const totalQuantity = validatedItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    if (creditAmount <= 0) {
      await transaction.rollback();
      return sendErrorResponse(
        res,
        400,
        "Credit note amount must be greater than zero",
      );
    }

    // --------------------------------------------------------
    // CREATE CREDIT NOTE HEADER
    // --------------------------------------------------------

    const creditNote = await OrderCreditNote.create(
      {
        orderId: order.id,
        orderNo: order.orderNo,
        creditNoteNumber: finalCreditNoteNumber,
        creditNoteLink,
        reason: reason || null,
        remarks,
        totalQuantity,
        totalAmount: creditAmount,
        status: "ISSUED",
        createdBy: req.user?.userId || order.createdBy,
      },
      {
        transaction,
      },
    );

    // --------------------------------------------------------
    // CREATE CREDIT NOTE ITEMS
    // --------------------------------------------------------

    for (const item of validatedItems) {
      await OrderCreditNoteItem.create(
        {
          creditNoteId: creditNote.id,
          orderId: order.id,
          productId: item.productId,
          productCode: item.productCode,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          discountType: item.discountType,
          tax: item.tax,
          total: item.total,
          reason: item.reason,
        },
        {
          transaction,
        },
      );
    }

    // --------------------------------------------------------
    // RESTORE ONLY RETURNED STOCK (inside the transaction)
    // --------------------------------------------------------

    await restoreStock({
      products: validatedItems.map((item) => ({
        id: item.productId,
        productId: item.productId,
        quantity: item.quantity,
      })),
      orderNo: order.orderNo,
      transaction,
    });

    // --------------------------------------------------------
    // CALCULATE NEW RETURNED QUANTITIES
    // --------------------------------------------------------

    const newReturnedQuantityMap = {
      ...returnedQuantityMap,
    };

    for (const item of validatedItems) {
      newReturnedQuantityMap[item.productId] =
        Number(newReturnedQuantityMap[item.productId] || 0) +
        Number(item.quantity);
    }

    // --------------------------------------------------------
    // DETERMINE ORDER STATUS
    // --------------------------------------------------------

    const fullyReturned = isOrderFullyReturned({
      orderedQuantityMap,
      returnedQuantityMap: newReturnedQuantityMap,
    });

    const oldStatus = order.status;

    if (fullyReturned) {
      order.status = "RETURNED";
    } else if (oldStatus === "DELIVERED" || oldStatus === "RETURNED") {
      // Keep the delivery state when only part of the order has been returned.
      order.status = "PARTIALLY_DELIVERED";
    }

    await order.save({
      transaction,
    });

    // --------------------------------------------------------
    // GENERIC ACTIVITY LOG
    // --------------------------------------------------------

    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "CREATE_CREDIT_NOTE",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Credit note ${finalCreditNoteNumber} created for order ${order.orderNo}`,
      metadata: {
        orderNo: order.orderNo,
        creditNoteId: creditNote.id,
        creditNoteNumber: finalCreditNoteNumber,
        creditAmount,
        statusChange: {
          from: oldStatus,
          to: order.status,
        },
        items: validatedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          total: item.total,
        })),
        stockRestored: true,
        fullyReturned,
      },
      req,
      transaction,
    });

    // --------------------------------------------------------
    // COMMIT
    // --------------------------------------------------------

    await transaction.commit();

    // --------------------------------------------------------
    // RESPOND IMMEDIATELY — the write already succeeded, so the
    // client must not be made to wait on anything below this
    // point (notifications, etc). This is what prevents the
    // request from appearing to "hang" after a successful commit.
    // --------------------------------------------------------

    const createdCreditNote = await OrderCreditNote.findByPk(creditNote.id, {
      include: [
        {
          model: OrderCreditNoteItem,
          as: "items",
        },
      ],
    });

    res.status(201).json({
      message: "Credit note created successfully",
      creditNote: createdCreditNote,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
      },
      returnSummary: {
        creditAmount,
        fullyReturned,
        items: validatedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          total: item.total,
        })),
      },
    });

    // --------------------------------------------------------
    // NOTIFICATIONS (fire-and-forget, after the response is sent)
    // --------------------------------------------------------
    //
    // These run after res.json() above, so a slow or hanging
    // notification service can no longer block or delay the
    // client response. Each call is capped with a timeout so a
    // stuck promise can't linger indefinitely in the background
    // either.
    // --------------------------------------------------------

    const withTimeout = (promise, ms = 5000) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("notification timeout")), ms),
        ),
      ]);

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
    );

    for (const userId of recipients) {
      withTimeout(
        sendNotification({
          userId,
          title: `Credit Note #${finalCreditNoteNumber}`,
          message: `Credit note ${finalCreditNoteNumber} created for order #${order.orderNo}. Returned amount: ${creditAmount}.`,
        }),
      ).catch((notifyErr) =>
        console.error("Credit note notification failed:", notifyErr),
      );
    }

    if (ADMIN_USER_ID) {
      withTimeout(
        sendNotification({
          userId: ADMIN_USER_ID,
          title: `Credit Note #${finalCreditNoteNumber}`,
          message: `Credit note ${finalCreditNoteNumber} created for order #${order.orderNo}.`,
        }),
      ).catch((notifyErr) =>
        console.error("Credit note admin notification failed:", notifyErr),
      );
    }

    return;
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {}

    console.error("Create Order Credit Note Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to create credit note",
      err.message,
    );
  }
};

// ============================================================
// GET CREDIT NOTE BY ID
// ============================================================

exports.getOrderCreditNoteById = async (req, res) => {
  try {
    const { creditNoteId, id } = req.params;
    const targetId = creditNoteId || id;

    const creditNote = await OrderCreditNote.findByPk(targetId, {
      include: [
        {
          model: OrderCreditNoteItem,
          as: "items",
        },
        {
          model: Order,
          as: "order",
          include: [
            {
              model: Customer,
              as: "customer",
            },
          ],
        },
      ],
    });

    if (!creditNote) {
      return sendErrorResponse(res, 404, "Credit note not found");
    }

    return res.status(200).json({
      message: "Credit note fetched successfully",
      creditNote,
    });
  } catch (err) {
    console.error("Get Order Credit Note Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to fetch credit note",
      err.message,
    );
  }
};

// ============================================================
// GET ALL CREDIT NOTES FOR ORDER
// ============================================================

exports.getOrderCreditNotes = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    const creditNotes = await OrderCreditNote.findAll({
      where: {
        orderId,
      },
      include: [
        {
          model: OrderCreditNoteItem,
          as: "items",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      message: "Order credit notes fetched successfully",
      order: {
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
      },
      count: creditNotes.length,
      creditNotes,
    });
  } catch (err) {
    console.error("Get Order Credit Notes Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to fetch order credit notes",
      err.message,
    );
  }
};

// ============================================================
// GET RETURNABLE QUANTITIES FOR AN ORDER
// ============================================================
//
// Useful for the frontend — tells the UI exactly how much of
// each product can still be returned.
//

exports.getOrderReturnableItems = async (req, res) => {
  const transaction = await Order.sequelize.transaction();

  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Customer,
          as: "customer",
        },
      ],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return sendErrorResponse(res, 404, "Order not found");
    }

    const allowedStatuses = ["DELIVERED", "PARTIALLY_DELIVERED", "RETURNED"];

    if (!allowedStatuses.includes(order.status)) {
      await transaction.rollback();
      return sendErrorResponse(
        res,
        400,
        `Order is not eligible for return in ${order.status} status`,
      );
    }

    const returnedQuantityMap = await getReturnedQuantityMap(
      order.id,
      transaction,
    );

    const returnableItems = [];

    for (const product of order.products || []) {
      const productId = product.id || product.productId;

      if (!productId) continue;

      const orderedQuantity = Number(product.quantity || 0);
      const returnedQuantity = Number(returnedQuantityMap[productId] || 0);
      const remainingQuantity = Math.max(0, orderedQuantity - returnedQuantity);

      returnableItems.push({
        productId,
        name: product.name || "Unknown Product",
        imageUrl: product.imageUrl || product.image || null,
        orderedQuantity,
        returnedQuantity,
        remainingQuantity,
        price: Number(product.price || 0),
        discount: Number(product.discount || 0),
        discountType: product.discountType || "percent",
        returnable: remainingQuantity > 0,
      });
    }

    await transaction.commit();

    return res.status(200).json({
      message: "Returnable items fetched successfully",
      order: {
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
        customer: order.customer?.name || null,
      },
      items: returnableItems,
      canReturn: returnableItems.some((item) => item.returnable),
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {}

    console.error("Get Returnable Order Items Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to fetch returnable items",
      err.message,
    );
  }
};

// ============================================================
// CANCEL CREDIT NOTE
// ============================================================
//
// IMPORTANT:
// If a credit note is canceled, the stock restored by that
// credit note must be deducted again, to prevent inventory
// from remaining artificially increased.
//

exports.cancelOrderCreditNote = async (req, res) => {
  const transaction = await Order.sequelize.transaction();

  try {
    const { creditNoteId, id } = req.params;
    const targetId = creditNoteId || id;

    const creditNote = await OrderCreditNote.findByPk(targetId, {
      include: [
        {
          model: OrderCreditNoteItem,
          as: "items",
        },
        {
          model: Order,
          as: "order",
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!creditNote) {
      await transaction.rollback();
      return sendErrorResponse(res, 404, "Credit note not found");
    }

    if (creditNote.status === "CANCELED") {
      await transaction.rollback();
      return sendErrorResponse(res, 400, "Credit note is already canceled");
    }

    const order = creditNote.order;

    if (!order) {
      await transaction.rollback();
      return sendErrorResponse(res, 404, "Original order not found");
    }

    // --------------------------------------------------------
    // REMOVE THE PREVIOUS STOCK RESTORATION
    // --------------------------------------------------------

    const productUpdates = (creditNote.items || []).map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity || 0),
    }));

    const productsForReduction = [];

    for (const item of productUpdates) {
      const product = await Product.findByPk(item.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          404,
          `Product not found: ${item.productId}`,
        );
      }

      productsForReduction.push({
        productId: item.productId,
        quantityToReduce: item.quantity,
        productRecord: product,
      });
    }

    if (productsForReduction.length > 0) {
      await reduceStockAndLog({
        productUpdates: productsForReduction,
        createdBy: req.user?.userId || order.createdBy,
        orderNo: order.orderNo,
        transaction,
      });
    }

    // --------------------------------------------------------
    // CANCEL CREDIT NOTE
    // --------------------------------------------------------

    creditNote.status = "CANCELED";

    await creditNote.save({
      transaction,
    });

    // --------------------------------------------------------
    // RECALCULATE ORDER RETURN STATUS
    // --------------------------------------------------------

    const returnedQuantityMap = await getReturnedQuantityMap(
      order.id,
      transaction,
    );

    const orderedQuantityMap = getOrderedQuantityMap(order);

    const fullyReturned = isOrderFullyReturned({
      orderedQuantityMap,
      returnedQuantityMap,
    });

    const oldStatus = order.status;

    if (fullyReturned) {
      order.status = "RETURNED";
    } else {
      order.status = "DELIVERED";
    }

    await order.save({
      transaction,
    });

    // --------------------------------------------------------
    // ORDER ACTIVITY
    // --------------------------------------------------------

    await logOrderActivity({
      orderId: order.id,
      orderNo: order.orderNo,
      action: "ORDER_CREDIT_NOTE_CANCELED",
      description: `Credit note ${creditNote.creditNoteNumber} canceled for order ${order.orderNo}`,
      oldValue: {
        status: oldStatus,
        creditNoteStatus: "ISSUED",
      },
      newValue: {
        status: order.status,
        creditNoteStatus: "CANCELED",
      },
      performedBy: req.user?.userId || order.createdBy,
      metadata: {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
        amount: creditNote.totalAmount,
        stockRestoredReversed: true,
      },
      req,
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      message: "Credit note canceled successfully",
      creditNote,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        status: order.status,
      },
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {}

    console.error("Cancel Order Credit Note Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to cancel credit note",
      err.message,
    );
  }
};

// ============================================================
// UPDATE CREDIT NOTE
// ============================================================
//
// Allows updating:
// - reason
// - remarks
// - credit note number
// - status (DRAFT / ISSUED / RECEIVED only)
//
// Items should NOT be freely changed after issuance because
// changing quantities would affect stock and return calculations.
// To change returned quantities, cancel the existing credit
// note and create a new one.
//
// ============================================================

exports.updateCreditNote = async (req, res) => {
  const transaction = await Order.sequelize.transaction();

  try {
    const { orderId, creditNoteId } = req.params;
    const { creditNoteNumber, reason, remarks, status } = req.body;

    const creditNote = await OrderCreditNote.findOne({
      where: {
        id: creditNoteId,
        orderId,
      },
      include: [
        {
          model: OrderCreditNoteItem,
          as: "items",
        },
        {
          model: Order,
          as: "order",
        },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!creditNote) {
      await transaction.rollback();
      return sendErrorResponse(
        res,
        404,
        "Credit note not found for this order",
      );
    }

    if (creditNote.status === "CANCELED") {
      await transaction.rollback();
      return sendErrorResponse(
        res,
        400,
        "Canceled credit notes cannot be updated",
      );
    }

    // --------------------------------------------------------
    // CREDIT NOTE NUMBER
    // --------------------------------------------------------

    if (creditNoteNumber && creditNoteNumber !== creditNote.creditNoteNumber) {
      const existing = await OrderCreditNote.findOne({
        where: {
          creditNoteNumber,
          id: {
            [Op.ne]: creditNote.id,
          },
        },
        transaction,
      });

      if (existing) {
        await transaction.rollback();
        return sendErrorResponse(res, 400, "Credit note number already exists");
      }

      creditNote.creditNoteNumber = creditNoteNumber;
    }

    // --------------------------------------------------------
    // UPDATE BASIC FIELDS
    // --------------------------------------------------------

    if (reason !== undefined) {
      creditNote.reason = reason || null;
    }

    if (remarks !== undefined) {
      creditNote.remarks = remarks || null;
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------
    //
    // Only safe status transitions here. CANCELED must go
    // through cancelOrderCreditNote() because cancellation
    // also reverses stock.
    //
    // --------------------------------------------------------

    if (status !== undefined) {
      const allowedStatuses = ["DRAFT", "ISSUED", "RECEIVED"];

      if (!allowedStatuses.includes(status)) {
        await transaction.rollback();
        return sendErrorResponse(
          res,
          400,
          `Invalid credit note status: ${status}`,
        );
      }

      creditNote.status = status;
    }

    await creditNote.save({
      transaction,
    });

    // --------------------------------------------------------
    // ACTIVITY
    // --------------------------------------------------------

    const userId =
      req.user?.userId || creditNote.createdBy || creditNote.order?.createdBy;

    await logOrderActivity({
      orderId: creditNote.orderId,
      orderNo: creditNote.orderNo,
      action: "ORDER_CREDIT_NOTE_UPDATED",
      description: `Credit note ${creditNote.creditNoteNumber} updated for order ${creditNote.orderNo}`,
      oldValue: null,
      newValue: {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
        reason: creditNote.reason,
        remarks: creditNote.remarks,
        status: creditNote.status,
      },
      performedBy: userId,
      metadata: {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
      },
      req,
      transaction,
    });

    await transaction.commit();

    const updatedCreditNote = await OrderCreditNote.findByPk(creditNote.id, {
      include: [
        {
          model: OrderCreditNoteItem,
          as: "items",
        },
      ],
    });

    return res.status(200).json({
      message: "Credit note updated successfully",
      creditNote: updatedCreditNote,
    });
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {}

    console.error("Update Credit Note Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to update credit note",
      err.message,
    );
  }
};

// ============================================================
// UPLOAD / REPLACE CREDIT NOTE DOCUMENT
// ============================================================
//
// Route:
// POST /orders/:orderId/credit-notes/:creditNoteId/document
// Multer field: file
//
// ============================================================

exports.uploadCreditNoteDocument = async (req, res) => {
  try {
    const { orderId, creditNoteId } = req.params;

    if (!req.file) {
      return sendErrorResponse(res, 400, "Credit note document is required");
    }

    const creditNote = await OrderCreditNote.findOne({
      where: {
        id: creditNoteId,
        orderId,
      },
    });

    if (!creditNote) {
      return sendErrorResponse(
        res,
        404,
        "Credit note not found for this order",
      );
    }

    if (creditNote.status === "CANCELED") {
      return sendErrorResponse(
        res,
        400,
        "Cannot upload document to a canceled credit note",
      );
    }

    // --------------------------------------------------------
    // UPLOAD FILE
    // --------------------------------------------------------
    //
    // req.file only has a `buffer` (multer memoryStorage), so it
    // has to actually be shipped to FTP here to get a public URL.
    // --------------------------------------------------------

    let documentUrl;

    try {
      documentUrl = await uploadCreditNoteFile(req.file);
    } catch (uploadErr) {
      console.error("Credit note file upload failed:", uploadErr);
      return sendErrorResponse(
        res,
        500,
        "Failed to upload credit note document",
        uploadErr.message,
      );
    }

    if (!documentUrl) {
      return sendErrorResponse(res, 500, "File upload did not return a URL");
    }

    creditNote.creditNoteLink = documentUrl;

    await creditNote.save();

    await logOrderActivity({
      orderId: creditNote.orderId,
      orderNo: creditNote.orderNo,
      action: "ORDER_CREDIT_NOTE_DOCUMENT_UPLOADED",
      description: `Credit note document uploaded for ${creditNote.creditNoteNumber}`,
      oldValue: null,
      newValue: {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
        creditNoteLink: documentUrl,
      },
      performedBy: req.user?.userId || creditNote.createdBy,
      metadata: {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
        documentUrl,
      },
      req,
    });

    return res.status(200).json({
      message: "Credit note document uploaded successfully",
      creditNote: {
        id: creditNote.id,
        orderId: creditNote.orderId,
        orderNo: creditNote.orderNo,
        creditNoteNumber: creditNote.creditNoteNumber,
        creditNoteLink: creditNote.creditNoteLink,
      },
    });
  } catch (err) {
    console.error("Upload Credit Note Document Error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to upload credit note document",
      err.message,
    );
  }
};
