// controllers/order-extensions.controller.js
//
// Drop these exports into your existing order.controller.js (or require and
// re-export them from your routes file — either works). They rely on the
// same helpers/imports already present at the top of order.controller.js:
// path, uuidv4, sequelize, Op, uploadToFtp, sendNotification,
// sendErrorResponse, Order, Customer, Product.
//
// Also requires the two new models (Order.hasMany already wired in
// models/Order.js) and the new activity logger:

const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../../config/database");
const { Op } = require("sequelize");
const { uploadToFtp } = require("../../middleware/upload");
const { sendNotification } = require("../engagement/notification.controller");
const logOrderActivity = require("./order-activity-logger");
const {
  Order,
  Customer,
  OrderDispatch,
  OrderActivity,
} = require("../../models");

const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

const sendErrorResponse = (res, status, message, details = null) => {
  const response = { message };
  if (details) response.details = details;
  return res.status(status).json(response);
};

// ──────── CREATE PARTIAL/FULL DISPATCH ────────
// POST /orders/:id/dispatch
// body: { items: [{ productId, quantity }], carrier, trackingNumber, remarks }
// file (optional): gate-pass for this specific dispatch batch
exports.createDispatch = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { carrier, trackingNumber, remarks, invoiceLink } = req.body;

    let items;

    try {
      items =
        typeof req.body.items === "string"
          ? JSON.parse(req.body.items)
          : req.body.items;
    } catch (parseError) {
      await t.rollback();
      return sendErrorResponse(res, 400, "Invalid items JSON");
    }

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return sendErrorResponse(res, 400, "items array is required");
    }

    const order = await Order.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!order) {
      await t.rollback();
      return sendErrorResponse(res, 404, "Order not found");
    }

    const orderProducts = order.products || [];

    if (!orderProducts.length) {
      await t.rollback();
      return sendErrorResponse(res, 400, "Order has no products to dispatch");
    }

    if (["CANCELED", "CLOSED", "DRAFT"].includes(order.status)) {
      await t.rollback();

      return sendErrorResponse(
        res,
        400,
        `Cannot dispatch an order with status ${order.status}`,
      );
    }

    // -------------------------------------------------------
    // INVOICE REQUIREMENT
    // -------------------------------------------------------

    const invoiceFile = req.files?.invoice?.[0] || null;
    const gatePassFile = req.files?.gatePass?.[0] || null;

    let finalInvoiceLink = order.invoiceLink || null;

    // Existing invoice already attached to order
    if (finalInvoiceLink) {
      // Nothing required.
    }

    // New invoice uploaded with this dispatch
    else if (invoiceFile) {
      try {
        const ext =
          path.extname(invoiceFile.originalname).toLowerCase() || ".pdf";

        finalInvoiceLink = await uploadToFtp(
          invoiceFile.buffer,
          `${uuidv4()}${ext}`,
          {
            remoteDir: "/invoice_pdfs",
            chmod: "644",
          },
        );
      } catch (ftpErr) {
        await t.rollback();

        return sendErrorResponse(
          res,
          500,
          "Invoice upload failed",
          ftpErr.message,
        );
      }
    }

    // Optional existing invoice URL supplied by client
    else if (invoiceLink && String(invoiceLink).trim()) {
      finalInvoiceLink = String(invoiceLink).trim();
    }

    // No invoice anywhere
    else {
      await t.rollback();

      return sendErrorResponse(
        res,
        400,
        "Invoice is required before dispatch. Upload an invoice or provide an invoiceLink.",
      );
    }

    // -------------------------------------------------------
    // GATE PASS UPLOAD
    // -------------------------------------------------------

    let gatePassLink = null;

    if (gatePassFile) {
      try {
        const ext =
          path.extname(gatePassFile.originalname).toLowerCase() || ".pdf";

        gatePassLink = await uploadToFtp(
          gatePassFile.buffer,
          `${uuidv4()}${ext}`,
          {
            remoteDir: "/invoice_pdfs",
            chmod: "644",
          },
        );
      } catch (ftpErr) {
        await t.rollback();

        return sendErrorResponse(
          res,
          500,
          "Gate-pass upload failed",
          ftpErr.message,
        );
      }
    }

    // -------------------------------------------------------
    // PREVIOUS DISPATCHES
    // -------------------------------------------------------

    const priorDispatches = await OrderDispatch.findAll({
      where: { orderId: order.id },
      attributes: ["items"],
      transaction: t,
    });

    const alreadyDispatchedMap = {};

    for (const d of priorDispatches) {
      for (const it of d.items || []) {
        alreadyDispatchedMap[it.productId] =
          (alreadyDispatchedMap[it.productId] || 0) + Number(it.quantity);
      }
    }

    // -------------------------------------------------------
    // VALIDATE DISPATCH ITEMS
    // -------------------------------------------------------

    const dispatchItems = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const reqItem of items) {
      const productId = reqItem.productId || reqItem.id;
      const qty = Number(reqItem.quantity);

      if (!productId || !qty || qty < 1) {
        await t.rollback();

        return sendErrorResponse(
          res,
          400,
          "Each dispatch item needs a productId and quantity >= 1",
        );
      }

      const orderedLine = orderProducts.find(
        (p) => (p.productId || p.id) === productId,
      );

      if (!orderedLine) {
        await t.rollback();

        return sendErrorResponse(
          res,
          400,
          `Product ${productId} is not part of this order`,
        );
      }

      const orderedQty = Number(orderedLine.quantity) || 0;
      const alreadyDispatched = alreadyDispatchedMap[productId] || 0;

      const remaining = orderedQty - alreadyDispatched;

      if (qty > remaining) {
        await t.rollback();

        return sendErrorResponse(
          res,
          400,
          `Cannot dispatch ${qty} of "${orderedLine.name}". Only ${remaining} remaining (ordered ${orderedQty}, already dispatched ${alreadyDispatched}).`,
        );
      }

      const unitPrice = Number(orderedLine.price) || 0;

      dispatchItems.push({
        productId,
        name: orderedLine.name,
        productCode: orderedLine.productCode || "",
        quantity: qty,
        price: unitPrice,
        total: Number((unitPrice * qty).toFixed(2)),
      });

      totalQuantity += qty;
      totalAmount += unitPrice * qty;
    }

    // -------------------------------------------------------
    // CREATE DISPATCH
    // -------------------------------------------------------

    const dispatchCount = await OrderDispatch.count({
      where: { orderId: order.id },
      transaction: t,
    });

    const dispatch = await OrderDispatch.create(
      {
        orderId: order.id,
        orderNo: order.orderNo,
        dispatchNumber: dispatchCount + 1,
        items: dispatchItems,
        totalQuantity,
        totalAmount: Number(totalAmount.toFixed(2)),
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
        gatePassLink,
        remarks: remarks || null,
        dispatchedBy: req.user?.userId || order.createdBy,
      },
      { transaction: t },
    );

    // -------------------------------------------------------
    // CALCULATE NEW STATUS
    // -------------------------------------------------------

    const combinedDispatchedMap = {
      ...alreadyDispatchedMap,
    };

    for (const it of dispatchItems) {
      combinedDispatchedMap[it.productId] =
        (combinedDispatchedMap[it.productId] || 0) + it.quantity;
    }

    const totalOrderedQty = orderProducts.reduce(
      (s, p) => s + (Number(p.quantity) || 0),
      0,
    );

    const totalDispatchedQtyAfter = Object.values(combinedDispatchedMap).reduce(
      (s, v) => s + v,
      0,
    );

    const oldStatus = order.status;

    const newStatus =
      totalDispatchedQtyAfter >= totalOrderedQty
        ? "DISPATCHED"
        : "PARTIALLY_DISPATCHED";

    // -------------------------------------------------------
    // UPDATE ORDER DOCUMENT LINKS
    // -------------------------------------------------------

    if (finalInvoiceLink && finalInvoiceLink !== order.invoiceLink) {
      order.invoiceLink = finalInvoiceLink;
    }

    if (gatePassLink) {
      order.gatePassLink = gatePassLink;
    }

    order.status = newStatus;

    await order.save({
      transaction: t,
    });

    await t.commit();

    // -------------------------------------------------------
    // ACTIVITY
    // -------------------------------------------------------

    await logOrderActivity({
      orderId: order.id,
      orderNo: order.orderNo,
      action: "DISPATCH_CREATED",
      description: `Dispatch #${dispatch.dispatchNumber} created for order ${order.orderNo} (${totalQuantity} unit(s))`,
      oldValue: {
        status: oldStatus,
      },
      newValue: {
        status: newStatus,
        dispatchId: dispatch.id,
        items: dispatchItems,
        invoiceLink: finalInvoiceLink,
        gatePassLink,
      },
      performedBy: req.user?.userId || order.createdBy,
      metadata: {
        carrier,
        trackingNumber,
        totalAmount,
        invoiceUploadedDuringDispatch: !!invoiceFile,
        gatePassUploadedDuringDispatch: !!gatePassFile,
      },
      req,
    });

    // -------------------------------------------------------
    // NOTIFICATIONS
    // -------------------------------------------------------

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
    );

    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Dispatch #${dispatch.dispatchNumber} – Order #${order.orderNo}`,
        message: `${totalQuantity} unit(s) dispatched. Order status: ${newStatus}.`,
      });
    }

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Dispatch #${dispatch.dispatchNumber} – Order #${order.orderNo}`,
      message: `Order #${order.orderNo} ${
        newStatus === "DISPATCHED" ? "fully" : "partially"
      } dispatched.`,
    });

    return res.status(201).json({
      message: "Dispatch recorded successfully",
      dispatch,
      orderStatus: newStatus,
      invoiceLink: finalInvoiceLink,
      gatePassLink,
    });
  } catch (err) {
    try {
      await t.rollback();
    } catch (_) {}

    return sendErrorResponse(
      res,
      500,
      "Failed to create dispatch",
      err.message,
    );
  }
};

// ──────── LIST DISPATCH HISTORY FOR AN ORDER ────────
// GET /orders/:id/dispatches
exports.getOrderDispatches = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      attributes: ["id", "orderNo"],
    });
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    const dispatches = await OrderDispatch.findAll({
      where: { orderId: id },
      order: [["dispatchNumber", "ASC"]],
    });

    return res.status(200).json({ orderNo: order.orderNo, dispatches });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch dispatches",
      err.message,
    );
  }
};

// ──────── LIST ORDER ACTIVITY LOG ────────
// GET /orders/:id/activity?page=1&limit=20
exports.getOrderActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendErrorResponse(res, 400, "Invalid page number");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendErrorResponse(res, 400, "Invalid limit (must be 1-100)");
    }

    const order = await Order.findByPk(id, { attributes: ["id", "orderNo"] });
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    const { count, rows } = await OrderActivity.findAndCountAll({
      where: { orderId: id },
      order: [["createdAt", "DESC"]],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });

    return res.status(200).json({
      orderNo: order.orderNo,
      activities: rows,
      totalCount: count,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to fetch order activity",
      err.message,
    );
  }
};

// ──────── UPLOAD CREDIT NOTE ────────
// POST /orders/:orderId/credit-note
// Uploads the document and stores the link. Does NOT change status by
// itself — the order can only move to RETURNED once this link is set
// (see the gate check added to updateOrderStatus / updateOrderById).
exports.uploadCreditNote = async (req, res) => {
  try {
    if (!req.file) return sendErrorResponse(res, 400, "No file uploaded");

    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    const ext = path.extname(req.file.originalname) || ".pdf";
    const uniqueName = `${uuidv4()}${ext}`;

    let fileUrl;
    try {
      fileUrl = await uploadToFtp(req.file.buffer, uniqueName, {
        remoteDir: "/invoice_pdfs",
        chmod: "644",
      });
    } catch (ftpErr) {
      return sendErrorResponse(
        res,
        500,
        "Credit note upload failed",
        ftpErr.message,
      );
    }

    const oldLink = order.creditNoteLink || null;
    order.creditNoteLink = fileUrl;
    await order.save();

    const customer = await Customer.findByPk(order.createdFor);

    await logOrderActivity({
      orderId: order.id,
      orderNo: order.orderNo,
      action: "CREDIT_NOTE_UPLOADED",
      description: `Credit note uploaded for order ${order.orderNo}`,
      oldValue: { creditNoteLink: oldLink },
      newValue: { creditNoteLink: fileUrl },
      performedBy: req.user?.userId || order.createdBy,
      metadata: {
        fileName: uniqueName,
        fileSize: req.file.size,
        replaced: !!oldLink,
        customerName: customer?.name || null,
      },
      req,
    });

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
    );
    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Credit Note Uploaded – Order #${order.orderNo}`,
        message: `A credit note has been uploaded for order #${order.orderNo} for ${customer?.name || "Customer"}.`,
      });
    }
    if (ADMIN_USER_ID) {
      await sendNotification({
        userId: ADMIN_USER_ID,
        title: `Credit Note Uploaded – Order #${order.orderNo}`,
        message: `Credit note uploaded for order #${order.orderNo}.`,
      });
    }

    return res.status(200).json({
      message: "Credit note uploaded successfully",
      creditNoteLink: fileUrl,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to upload credit note",
      err.message,
    );
  }
};

// ──────── UPLOAD RECEIVING DOCUMENT ────────
// POST /orders/:orderId/receiving-document
// Same pattern as gate-pass / invoice upload.
exports.uploadReceivingDocument = async (req, res) => {
  try {
    if (!req.file) return sendErrorResponse(res, 400, "No file uploaded");

    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return sendErrorResponse(res, 404, "Order not found");

    const ext = path.extname(req.file.originalname) || ".pdf";
    const uniqueName = `${uuidv4()}${ext}`;

    let fileUrl;
    try {
      fileUrl = await uploadToFtp(req.file.buffer, uniqueName, {
        remoteDir: "/invoice_pdfs",
        chmod: "644",
      });
    } catch (ftpErr) {
      return sendErrorResponse(
        res,
        500,
        "Receiving document upload failed",
        ftpErr.message,
      );
    }

    const oldLink = order.receivingDocumentLink || null;
    order.receivingDocumentLink = fileUrl;
    await order.save();

    const customer = await Customer.findByPk(order.createdFor);

    await logOrderActivity({
      orderId: order.id,
      orderNo: order.orderNo,
      action: "RECEIVING_DOCUMENT_UPLOADED",
      description: `Receiving document uploaded for order ${order.orderNo}`,
      oldValue: { receivingDocumentLink: oldLink },
      newValue: { receivingDocumentLink: fileUrl },
      performedBy: req.user?.userId || order.createdBy,
      metadata: {
        fileName: uniqueName,
        fileSize: req.file.size,
        replaced: !!oldLink,
        customerName: customer?.name || null,
      },
      req,
    });

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
    );
    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Receiving Document Uploaded – Order #${order.orderNo}`,
        message: `A receiving document has been uploaded for order #${order.orderNo} for ${customer?.name || "Customer"}.`,
      });
    }
    if (ADMIN_USER_ID) {
      await sendNotification({
        userId: ADMIN_USER_ID,
        title: `Receiving Document Uploaded – Order #${order.orderNo}`,
        message: `Receiving document uploaded for order #${order.orderNo}.`,
      });
    }

    return res.status(200).json({
      message: "Receiving document uploaded successfully",
      receivingDocumentLink: fileUrl,
    });
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to upload receiving document",
      err.message,
    );
  }
};
