const axios = require("axios");
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
// files (both required, or provide the matching *Link string instead):
//   invoice  — this dispatch's own invoice
//   gatePass — this dispatch's own gate-pass
//
// IMPORTANT: Every dispatch batch must carry its OWN invoice and gate-pass.
// Nothing is inherited from the order or from a prior dispatch — a partial
// shipment is its own legal/paperwork event.
exports.createDispatch = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { carrier, trackingNumber, remarks, invoiceLink, gatePassLink } =
      req.body;

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
    // PER-DISPATCH INVOICE
    //
    // This dispatch batch must carry its own invoice. We never
    // fall back to order.invoiceLink or a previous dispatch's
    // invoice — each shipment gets its own paperwork.
    // -------------------------------------------------------

    const invoiceFile = req.files?.invoice?.[0] || null;
    const gatePassFile = req.files?.gatePass?.[0] || null;

    let finalInvoiceLink = null;

    if (invoiceFile) {
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
    } else if (invoiceLink && String(invoiceLink).trim()) {
      finalInvoiceLink = String(invoiceLink).trim();
    } else {
      await t.rollback();

      return sendErrorResponse(
        res,
        400,
        "This dispatch needs its own invoice. Upload an invoice file or provide invoiceLink.",
      );
    }

    // -------------------------------------------------------
    // PER-DISPATCH GATE PASS
    //
    // Same rule as invoice: required on every dispatch, never
    // inherited.
    // -------------------------------------------------------

    let finalGatePassLink = null;

    if (gatePassFile) {
      try {
        const ext =
          path.extname(gatePassFile.originalname).toLowerCase() || ".pdf";

        finalGatePassLink = await uploadToFtp(
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
    } else if (gatePassLink && String(gatePassLink).trim()) {
      finalGatePassLink = String(gatePassLink).trim();
    } else {
      await t.rollback();

      return sendErrorResponse(
        res,
        400,
        "This dispatch needs its own gate-pass. Upload a gate-pass file or provide gatePassLink.",
      );
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
        invoiceLink: finalInvoiceLink,
        gatePassLink: finalGatePassLink,
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
    // MIRROR LATEST DOCS ONTO THE ORDER
    //
    // These order-level fields are kept only as a quick-view /
    // legacy convenience (e.g. downloadInvoice, getDownloadDocument).
    // They are NOT authoritative and are NOT used for any gating
    // logic anymore — always read the specific OrderDispatch record
    // for that shipment's actual invoice/gate-pass.
    // -------------------------------------------------------

    order.invoiceLink = finalInvoiceLink;
    order.gatePassLink = finalGatePassLink;

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
        gatePassLink: finalGatePassLink,
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
      gatePassLink: finalGatePassLink,
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
// ─────────────────────────────────────────────────────────────
// GLOBAL DISPATCH HISTORY
// GET /order/dispatch-history
//
// Supports searching/filtering by:
//
// General:
//   search
//
// Product:
//   product
//   productId
//
// Dispatch:
//   status
//   carrier
//   trackingNumber
//   orderNo
//   dispatchNumber
//   dateFrom
//   dateTo
//
// Pagination:
//   page
//   limit
// ─────────────────────────────────────────────────────────────

exports.getAllDispatchHistory = async (req, res) => {
  try {
    const {
      search = "",
      product = "",
      productId = "",
      status = "",
      carrier = "",
      trackingNumber = "",
      orderNo = "",
      dispatchNumber = "",
      dateFrom = "",
      dateTo = "",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const where = {
      [Op.and]: [],
    };

    // ---------------------------------------------------------
    // GENERAL SEARCH
    //
    // Searches:
    // - Order number
    // - Carrier
    // - Tracking number
    // - Remarks
    // - Product name inside items JSON
    // - Product code inside items JSON
    // ---------------------------------------------------------

    const cleanSearch = String(search).trim();

    if (cleanSearch) {
      const searchLike = `%${cleanSearch}%`;

      where[Op.and].push({
        [Op.or]: [
          { orderNo: { [Op.like]: searchLike } },
          { carrier: { [Op.like]: searchLike } },
          { trackingNumber: { [Op.like]: searchLike } },
          { remarks: { [Op.like]: searchLike } },

          // Product name
          sequelize.literal(`
            JSON_SEARCH(
              items,
              'one',
              ${sequelize.escape(searchLike)},
              NULL,
              '$[*].name'
            ) IS NOT NULL
          `),

          // Product code
          sequelize.literal(`
            JSON_SEARCH(
              items,
              'one',
              ${sequelize.escape(searchLike)},
              NULL,
              '$[*].productCode'
            ) IS NOT NULL
          `),
        ],
      });
    }

    // ---------------------------------------------------------
    // PRODUCT SEARCH
    //
    // Searches product snapshot:
    // - product name
    // - product code
    // ---------------------------------------------------------

    const cleanProduct = String(product).trim();

    if (cleanProduct) {
      const productLike = `%${cleanProduct}%`;

      where[Op.and].push({
        [Op.or]: [
          sequelize.literal(`
            JSON_SEARCH(
              items,
              'one',
              ${sequelize.escape(productLike)},
              NULL,
              '$[*].name'
            ) IS NOT NULL
          `),

          sequelize.literal(`
            JSON_SEARCH(
              items,
              'one',
              ${sequelize.escape(productLike)},
              NULL,
              '$[*].productCode'
            ) IS NOT NULL
          `),
        ],
      });
    }

    // ---------------------------------------------------------
    // EXACT PRODUCT ID
    // ---------------------------------------------------------

    const cleanProductId = String(productId).trim();

    if (cleanProductId) {
      where[Op.and].push(
        sequelize.literal(`
          JSON_SEARCH(
            items,
            'one',
            ${sequelize.escape(cleanProductId)},
            NULL,
            '$[*].productId'
          ) IS NOT NULL
        `),
      );
    }

    // ---------------------------------------------------------
    // DISPATCH STATUS
    // ---------------------------------------------------------

    if (String(status).trim()) {
      where.status = String(status).trim().toUpperCase();
    }

    // ---------------------------------------------------------
    // CARRIER
    // ---------------------------------------------------------

    if (String(carrier).trim()) {
      where.carrier = {
        [Op.like]: `%${String(carrier).trim()}%`,
      };
    }

    // ---------------------------------------------------------
    // TRACKING NUMBER
    // ---------------------------------------------------------

    if (String(trackingNumber).trim()) {
      where.trackingNumber = {
        [Op.like]: `%${String(trackingNumber).trim()}%`,
      };
    }

    // ---------------------------------------------------------
    // ORDER NUMBER
    // ---------------------------------------------------------

    if (String(orderNo).trim()) {
      where.orderNo = {
        [Op.like]: `%${String(orderNo).trim()}%`,
      };
    }

    // ---------------------------------------------------------
    // DISPATCH NUMBER
    // ---------------------------------------------------------

    if (String(dispatchNumber).trim()) {
      const number = parseInt(dispatchNumber, 10);

      if (!Number.isNaN(number)) {
        where.dispatchNumber = number;
      }
    }

    // ---------------------------------------------------------
    // DATE FILTER
    // ---------------------------------------------------------

    if (dateFrom || dateTo) {
      const dateWhere = {};

      if (dateFrom) {
        dateWhere[Op.gte] = `${dateFrom} 00:00:00`;
      }

      if (dateTo) {
        dateWhere[Op.lte] = `${dateTo} 23:59:59`;
      }

      where.dispatchDate = dateWhere;
    }

    // ---------------------------------------------------------
    // QUERY
    // ---------------------------------------------------------

    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await OrderDispatch.findAndCountAll({
      where,

      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "orderNo", "status", "createdFor"],
          required: false,
        },
        {
          model: require("../../models").User,
          as: "dispatcher",
          attributes: ["userId", "username", "name"],
          required: false,
        },
      ],

      order: [
        ["dispatchDate", "DESC"],
        ["createdAt", "DESC"],
      ],

      offset,
      limit: limitNum,

      distinct: true,
    });

    return res.status(200).json({
      data: rows,

      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    console.error("getAllDispatchHistory error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to fetch dispatch history",
      err.message,
    );
  }
};
// ──────── LIST DISPATCH HISTORY FOR AN ORDER ────────
// GET /orders/:id/dispatches

// Returns all dispatches for a single order with:
// - Complete dispatch information
// - Complete product snapshots
// - Discount information
// - Tax information
// - Per-unit pricing
// - Dispatch totals
// - Order-level financial summary
//
// Important:
// OrderDispatch.items contains the pricing snapshot captured
// when each dispatch was created. We do NOT recalculate prices
// from the current Product table.
//
// Each dispatch's `invoiceLink` and `gatePassLink` below are that
// specific shipment's documents — NOT the order-level mirror fields.

exports.getOrderDispatches = async (req, res) => {
  try {
    const { id } = req.params;

    // =========================================================
    // FIND ORDER
    // =========================================================

    const order = await Order.findByPk(id, {
      attributes: [
        "id",
        "orderNo",
        "status",
        "products",
        "finalAmount",
        "amountPaid",
        "invoiceLink",
        "gatePassLink",
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // =========================================================
    // GET DISPATCHES
    // =========================================================

    const dispatches = await OrderDispatch.findAll({
      where: {
        orderId: id,
      },

      include: [
        {
          model: require("../../models").User,
          as: "dispatcher",
          attributes: ["userId", "username", "name"],
          required: false,
        },
      ],

      order: [
        ["dispatchNumber", "ASC"],
        ["dispatchDate", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    // =========================================================
    // ORDER PRODUCT SNAPSHOT
    // =========================================================
    //
    // This is the original order pricing snapshot.
    //
    // It is used as a fallback for old dispatch records which may
    // not have all the newer pricing fields.
    //
    // It is NOT used to recalculate the financial value of a
    // dispatch when the dispatch already contains its own snapshot.

    const orderProducts = Array.isArray(order.products) ? order.products : [];

    const orderedMap = {};

    for (const product of orderProducts) {
      const productId = product.productId || product.id;

      if (!productId) continue;

      orderedMap[productId] = {
        productId,

        name: product.name || "",
        imageUrl: product.imageUrl || null,

        productCode: product.productCode || "",
        companyCode: product.companyCode || "",

        quantity: Number(product.quantity) || 0,

        // -----------------------------
        // ORIGINAL PRICING SNAPSHOT
        // -----------------------------

        price: Number(product.price) || 0,

        discount: Number(product.discount) || 0,

        discountType: product.discountType || "percent",

        discountAmount:
          product.discountAmount !== undefined &&
          product.discountAmount !== null
            ? Number(product.discountAmount)
            : 0,

        tax: Number(product.tax) || 0,

        unitNetPrice:
          product.unitNetPrice !== undefined && product.unitNetPrice !== null
            ? Number(product.unitNetPrice)
            : 0,

        unitTaxAmount:
          product.unitTaxAmount !== undefined && product.unitTaxAmount !== null
            ? Number(product.unitTaxAmount)
            : 0,

        unitFinalPrice:
          product.unitFinalPrice !== undefined &&
          product.unitFinalPrice !== null
            ? Number(product.unitFinalPrice)
            : 0,

        total: Number(product.total) || 0,
      };
    }

    // =========================================================
    // GLOBAL DISPATCH TRACKING
    // =========================================================

    const dispatchedMap = {};

    // Actual total quantity dispatched
    let totalDispatchedQuantity = 0;

    // Actual financial total of all dispatches
    let totalDispatchedAmount = 0;

    // Financial breakdown of all dispatches
    let totalDispatchSubtotal = 0;
    let totalDispatchDiscount = 0;
    let totalDispatchTax = 0;

    // =========================================================
    // NORMALIZE EACH DISPATCH
    // =========================================================

    const formattedDispatches = dispatches.map((dispatch) => {
      const rawItems = Array.isArray(dispatch.items) ? dispatch.items : [];

      let dispatchQuantity = 0;

      let dispatchSubtotal = 0;
      let dispatchDiscount = 0;
      let dispatchTax = 0;
      let dispatchAmount = 0;

      // =======================================================
      // DISPATCH ITEMS
      // =======================================================

      const items = rawItems.map((item) => {
        const productId = item.productId;

        const quantity = Math.max(Number(item.quantity) || 0, 0);

        const orderProduct = orderedMap[productId] || null;

        // =====================================================
        // PRODUCT INFORMATION
        // =====================================================

        const name = item.name || orderProduct?.name || "";

        const imageUrl = item.imageUrl || orderProduct?.imageUrl || null;

        const productCode = item.productCode || orderProduct?.productCode || "";

        const companyCode = item.companyCode || orderProduct?.companyCode || "";

        // =====================================================
        // PRICE SNAPSHOT
        // =====================================================
        //
        // IMPORTANT:
        //
        // Prefer the dispatch snapshot.
        //
        // Only fall back to the original order snapshot when
        // dealing with older dispatch records.
        //
        // NEVER read current Product pricing here.
        // =====================================================

        const price =
          item.price !== undefined && item.price !== null
            ? Number(item.price)
            : Number(orderProduct?.price) || 0;

        // =====================================================
        // DISCOUNT SNAPSHOT
        // =====================================================

        const discount =
          item.discount !== undefined && item.discount !== null
            ? Number(item.discount)
            : Number(orderProduct?.discount) || 0;

        const discountType =
          item.discountType || orderProduct?.discountType || "percent";

        // =====================================================
        // DISCOUNT AMOUNT PER UNIT
        // =====================================================

        let discountAmount;

        if (item.discountAmount !== undefined && item.discountAmount !== null) {
          discountAmount = Number(item.discountAmount);
        } else if (
          orderProduct?.discountAmount !== undefined &&
          orderProduct?.discountAmount !== null
        ) {
          discountAmount = Number(orderProduct.discountAmount);
        } else {
          discountAmount = 0;
        }

        // -----------------------------------------------------
        // FALLBACK DISCOUNT CALCULATION
        // -----------------------------------------------------

        if (discountAmount === 0 && discount !== 0) {
          if (discountType === "percent") {
            discountAmount = price * (discount / 100);
          } else {
            discountAmount = discount;
          }
        }

        // Prevent negative discount
        discountAmount = Math.max(discountAmount, 0);

        // =====================================================
        // UNIT NET PRICE
        // =====================================================

        const unitNetPrice =
          item.unitNetPrice !== undefined && item.unitNetPrice !== null
            ? Number(item.unitNetPrice)
            : Math.max(price - discountAmount, 0);

        // =====================================================
        // TAX RATE
        // =====================================================

        const tax =
          item.tax !== undefined && item.tax !== null
            ? Number(item.tax)
            : Number(orderProduct?.tax) || 0;

        // =====================================================
        // TAX AMOUNT PER UNIT
        // =====================================================

        const unitTaxAmount =
          item.unitTaxAmount !== undefined && item.unitTaxAmount !== null
            ? Number(item.unitTaxAmount)
            : unitNetPrice * (tax / 100);

        // =====================================================
        // FINAL UNIT PRICE
        // =====================================================

        const unitFinalPrice =
          item.unitFinalPrice !== undefined && item.unitFinalPrice !== null
            ? Number(item.unitFinalPrice)
            : unitNetPrice + unitTaxAmount;

        // =====================================================
        // QUANTITY-AWARE FINANCIAL CALCULATION
        // =====================================================
        //
        // THIS IS THE IMPORTANT FIX.
        //
        // Every financial amount represents the entire
        // dispatched line, not one unit.
        //
        // Example:
        //
        // quantity = 5
        // unitFinalPrice = ₹106.20
        //
        // total = ₹531.00
        //
        // NOT ₹106.20.
        // =====================================================

        const lineSubtotal = price * quantity;

        const lineDiscount = discountAmount * quantity;

        const lineTax = unitTaxAmount * quantity;

        const calculatedTotal = unitFinalPrice * quantity;

        // =====================================================
        // HISTORICAL TOTAL
        // =====================================================
        //
        // For NEW dispatch records:
        //
        // `item.total` should already contain the quantity-aware
        // line total.
        //
        // However, to prevent old/bad records from producing
        // incorrect financial summaries, we validate it against
        // the quantity-based calculation.
        //
        // The calculated quantity-aware amount is the source of
        // truth for this response.
        // =====================================================

        const storedTotal =
          item.total !== undefined && item.total !== null
            ? Number(item.total)
            : null;

        const total =
          quantity > 0
            ? calculatedTotal
            : storedTotal !== null
              ? storedTotal
              : 0;

        // =====================================================
        // QUANTITY TRACKING
        // =====================================================

        dispatchedMap[productId] = (dispatchedMap[productId] || 0) + quantity;

        dispatchQuantity += quantity;

        // =====================================================
        // DISPATCH FINANCIAL TOTALS
        // =====================================================

        dispatchSubtotal += lineSubtotal;

        dispatchDiscount += lineDiscount;

        dispatchTax += lineTax;

        dispatchAmount += total;

        // =====================================================
        // RETURN NORMALIZED ITEM
        // =====================================================

        return {
          productId,

          name,
          imageUrl,

          productCode,
          companyCode,

          // -----------------------------
          // QUANTITY
          // -----------------------------

          quantity,

          // -----------------------------
          // PER-UNIT VALUES
          // -----------------------------

          price: Number(price.toFixed(2)),

          discount: Number(discount.toFixed(2)),

          discountType,

          discountAmount: Number(discountAmount.toFixed(2)),

          tax: Number(tax.toFixed(2)),

          unitNetPrice: Number(unitNetPrice.toFixed(2)),

          unitTaxAmount: Number(unitTaxAmount.toFixed(2)),

          unitFinalPrice: Number(unitFinalPrice.toFixed(2)),

          // -----------------------------
          // QUANTITY-AWARE LINE VALUES
          // -----------------------------

          subtotal: Number(lineSubtotal.toFixed(2)),

          totalDiscount: Number(lineDiscount.toFixed(2)),

          totalTax: Number(lineTax.toFixed(2)),

          // THIS IS THE FINAL TOTAL FOR
          // THE ENTIRE DISPATCHED QUANTITY
          total: Number(total.toFixed(2)),

          // Optional diagnostic field.
          // Useful for identifying old dispatch records
          // where stored `item.total` was not quantity-aware.
          storedTotal:
            storedTotal !== null ? Number(storedTotal.toFixed(2)) : null,

          totalWasRecalculated:
            storedTotal !== null &&
            Math.abs(storedTotal - calculatedTotal) > 0.01,
        };
      });

      // =======================================================
      // DISPATCH TOTALS
      // =======================================================

      totalDispatchedQuantity += dispatchQuantity;

      totalDispatchSubtotal += dispatchSubtotal;

      totalDispatchDiscount += dispatchDiscount;

      totalDispatchTax += dispatchTax;

      totalDispatchedAmount += dispatchAmount;

      // =======================================================
      // RETURN DISPATCH
      // =======================================================

      return {
        id: dispatch.id,

        orderId: dispatch.orderId,

        orderNo: dispatch.orderNo,

        dispatchNumber: dispatch.dispatchNumber,

        items,

        // -----------------------------------------------------
        // QUANTITY
        // -----------------------------------------------------

        totalQuantity: Number(dispatchQuantity),

        // -----------------------------------------------------
        // FINANCIAL TOTALS
        // -----------------------------------------------------

        subtotal: Number(dispatchSubtotal.toFixed(2)),

        totalDiscount: Number(dispatchDiscount.toFixed(2)),

        totalTax: Number(dispatchTax.toFixed(2)),

        // IMPORTANT:
        // This is calculated from:
        //
        // SUM(unitFinalPrice × quantity)
        //
        // rather than blindly trusting dispatch.totalAmount.
        totalAmount: Number(dispatchAmount.toFixed(2)),

        // Preserve the database value for audit/debugging.
        storedTotalAmount:
          dispatch.totalAmount !== null && dispatch.totalAmount !== undefined
            ? Number(Number(dispatch.totalAmount).toFixed(2))
            : null,

        totalAmountWasRecalculated:
          dispatch.totalAmount !== null &&
          dispatch.totalAmount !== undefined &&
          Math.abs(Number(dispatch.totalAmount) - dispatchAmount) > 0.01,

        // -----------------------------------------------------
        // DISPATCH INFORMATION
        // -----------------------------------------------------

        dispatchDate: dispatch.dispatchDate,

        carrier: dispatch.carrier || null,

        trackingNumber: dispatch.trackingNumber || null,

        // -----------------------------------------------------
        // DISPATCH-SPECIFIC DOCUMENTS
        // -----------------------------------------------------

        invoiceLink: dispatch.invoiceLink || null,

        gatePassLink: dispatch.gatePassLink || null,

        remarks: dispatch.remarks || null,

        status: dispatch.status,

        dispatchedBy: dispatch.dispatchedBy || null,

        dispatcher: dispatch.dispatcher || null,

        createdAt: dispatch.createdAt,

        updatedAt: dispatch.updatedAt,
      };
    });

    // =========================================================
    // BUILD PRODUCT-LEVEL DISPATCH SUMMARY
    // =========================================================
    //
    // IMPORTANT:
    //
    // DO NOT calculate:
    //
    //   product.unitFinalPrice × dispatchedQuantity
    //
    // because dispatches may contain different historical
    // pricing snapshots.
    //
    // Instead we calculate dispatched financial values directly
    // from the dispatch history.
    // =========================================================

    const productFinancialMap = {};

    for (const dispatch of formattedDispatches) {
      for (const item of dispatch.items) {
        const productId = item.productId;

        if (!productFinancialMap[productId]) {
          productFinancialMap[productId] = {
            dispatchedAmount: 0,
            dispatchedSubtotal: 0,
            dispatchedDiscount: 0,
            dispatchedTax: 0,
          };
        }

        productFinancialMap[productId].dispatchedAmount +=
          Number(item.total) || 0;

        productFinancialMap[productId].dispatchedSubtotal +=
          Number(item.subtotal) || 0;

        productFinancialMap[productId].dispatchedDiscount +=
          Number(item.totalDiscount) || 0;

        productFinancialMap[productId].dispatchedTax +=
          Number(item.totalTax) || 0;
      }
    }

    const productSummary = Object.values(orderedMap).map((product) => {
      const orderedQuantity = Number(product.quantity) || 0;

      const dispatchedQuantity = Number(dispatchedMap[product.productId]) || 0;

      const remainingQuantity = Math.max(
        orderedQuantity - dispatchedQuantity,
        0,
      );

      const financial = productFinancialMap[product.productId] || {
        dispatchedAmount: 0,
        dispatchedSubtotal: 0,
        dispatchedDiscount: 0,
        dispatchedTax: 0,
      };

      // -------------------------------------------------------
      // ORDER SNAPSHOT REMAINING VALUE
      // -------------------------------------------------------
      //
      // This represents the remaining quantity valued using
      // the ORIGINAL order snapshot.
      //
      // It is intentionally different from dispatchedAmount,
      // which comes from actual dispatch history.
      // -------------------------------------------------------

      const remainingAmount = product.unitFinalPrice * remainingQuantity;

      return {
        productId: product.productId,

        name: product.name,

        imageUrl: product.imageUrl,

        productCode: product.productCode,

        companyCode: product.companyCode,

        // -----------------------------------------------------
        // QUANTITIES
        // -----------------------------------------------------

        orderedQuantity,

        dispatchedQuantity,

        remainingQuantity,

        // -----------------------------------------------------
        // ORIGINAL ORDER PRICING
        // -----------------------------------------------------

        price: Number(product.price.toFixed(2)),

        discount: Number(product.discount.toFixed(2)),

        discountType: product.discountType,

        discountAmount: Number(product.discountAmount.toFixed(2)),

        tax: Number(product.tax.toFixed(2)),

        unitNetPrice: Number(product.unitNetPrice.toFixed(2)),

        unitTaxAmount: Number(product.unitTaxAmount.toFixed(2)),

        unitFinalPrice: Number(product.unitFinalPrice.toFixed(2)),

        // -----------------------------------------------------
        // ORIGINAL ORDER TOTAL
        // -----------------------------------------------------

        orderedTotal: Number(product.total.toFixed(2)),

        // -----------------------------------------------------
        // ACTUAL DISPATCHED FINANCIAL VALUE
        // -----------------------------------------------------

        dispatchedSubtotal: Number(financial.dispatchedSubtotal.toFixed(2)),

        dispatchedDiscount: Number(financial.dispatchedDiscount.toFixed(2)),

        dispatchedTax: Number(financial.dispatchedTax.toFixed(2)),

        dispatchedAmount: Number(financial.dispatchedAmount.toFixed(2)),

        // -----------------------------------------------------
        // REMAINING VALUE
        // -----------------------------------------------------
        //
        // Based on original order pricing because there is no
        // future dispatch pricing snapshot yet.
        // -----------------------------------------------------

        remainingAmount: Number(remainingAmount.toFixed(2)),
      };
    });

    // =========================================================
    // ORDER TOTAL QUANTITY
    // =========================================================

    const totalOrderedQuantity = orderProducts.reduce(
      (sum, product) => sum + (Number(product.quantity) || 0),
      0,
    );

    // =========================================================
    // DISPATCH STATUS
    // =========================================================

    const fullyDispatched =
      orderProducts.length > 0 &&
      orderProducts.every((product) => {
        const productId = product.productId || product.id;

        const orderedQuantity = Number(product.quantity) || 0;

        const dispatchedQuantity = Number(dispatchedMap[productId]) || 0;

        return dispatchedQuantity >= orderedQuantity;
      });

    const partiallyDispatched = totalDispatchedQuantity > 0 && !fullyDispatched;

    // =========================================================
    // ORDER FINANCIAL RECONCILIATION
    // =========================================================

    const orderFinalAmount = Number(order.finalAmount) || 0;

    const orderAmountPaid = Number(order.amountPaid) || 0;

    const remainingOrderAmount = Math.max(
      orderFinalAmount - totalDispatchedAmount,
      0,
    );

    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(200).json({
      order: {
        id: order.id,

        orderNo: order.orderNo,

        status: order.status,

        // -----------------------------------------------------
        // ORDER-LEVEL DOCUMENT MIRRORS
        // -----------------------------------------------------
        //
        // These are only the latest mirrors.
        //
        // The authoritative documents for each shipment are:
        //
        // dispatches[].invoiceLink
        // dispatches[].gatePassLink
        // -----------------------------------------------------

        invoiceLink: order.invoiceLink || null,

        gatePassLink: order.gatePassLink || null,

        // -----------------------------------------------------
        // ORDER FINANCIALS
        // -----------------------------------------------------

        finalAmount: orderFinalAmount,

        amountPaid: orderAmountPaid,

        remainingAmount: Number(
          Math.max(orderFinalAmount - orderAmountPaid, 0).toFixed(2),
        ),
      },

      // =======================================================
      // DISPATCH SUMMARY
      // =======================================================

      summary: {
        totalDispatches: formattedDispatches.length,

        // -----------------------------------------------------
        // QUANTITY
        // -----------------------------------------------------

        totalOrderedQuantity,

        totalDispatchedQuantity,

        totalRemainingQuantity: Math.max(
          totalOrderedQuantity - totalDispatchedQuantity,
          0,
        ),

        // -----------------------------------------------------
        // STATUS
        // -----------------------------------------------------

        fullyDispatched,

        partiallyDispatched,

        // -----------------------------------------------------
        // ACTUAL DISPATCH FINANCIALS
        // -----------------------------------------------------

        totalDispatchSubtotal: Number(totalDispatchSubtotal.toFixed(2)),

        totalDispatchDiscount: Number(totalDispatchDiscount.toFixed(2)),

        totalDispatchTax: Number(totalDispatchTax.toFixed(2)),

        // FINAL VALUE OF ALL ACTUAL
        // DISPATCHED QUANTITIES
        totalDispatchedAmount: Number(totalDispatchedAmount.toFixed(2)),

        // -----------------------------------------------------
        // ORDER-LEVEL RECONCILIATION
        // -----------------------------------------------------

        orderFinalAmount,

        orderAmountPaid,

        remainingOrderAmount: Number(remainingOrderAmount.toFixed(2)),

        // -----------------------------------------------------
        // QUANTITY RECONCILIATION
        // -----------------------------------------------------

        quantityReconciled: totalDispatchedQuantity <= totalOrderedQuantity,

        quantityVariance: totalOrderedQuantity - totalDispatchedQuantity,

        // -----------------------------------------------------
        // FINANCIAL RECONCILIATION
        // -----------------------------------------------------
        //
        // This is useful when all order quantities have been
        // dispatched.
        //
        // If dispatch pricing snapshots are identical to the
        // original order pricing, this should be zero.
        //
        // If dispatch pricing changed historically, the
        // difference is expected and represents the difference
        // between original order value and actual dispatch
        // snapshot value.
        // -----------------------------------------------------

        orderVsDispatchedVariance: Number(
          (orderFinalAmount - totalDispatchedAmount).toFixed(2),
        ),
      },

      // =======================================================
      // PRODUCT SUMMARY
      // =======================================================

      products: productSummary,

      // =======================================================
      // COMPLETE DISPATCH HISTORY
      // =======================================================

      dispatches: formattedDispatches,
    });
  } catch (err) {
    console.error("getOrderDispatches error:", err);

    return sendErrorResponse(
      res,
      500,
      "Failed to fetch dispatches",
      err.message,
    );
  }
};

// ──────── DOWNLOAD A SPECIFIC DISPATCH'S DOCUMENT ────────
// GET /orders/:orderId/dispatches/:dispatchId/download?type=invoice|gatepass
//
// Unlike the order-level getDownloadDocument (which only ever returns
// the MOST RECENT dispatch's mirrored doc), this always returns the
// document that belongs to that exact dispatch batch.
exports.getDispatchDocument = async (req, res) => {
  try {
    const { orderId, dispatchId } = req.params;
    const { type } = req.query;

    if (!["invoice", "gatepass"].includes(type)) {
      return sendErrorResponse(
        res,
        400,
        "Invalid type. Use type=invoice or type=gatepass",
      );
    }

    const dispatch = await OrderDispatch.findOne({
      where: { id: dispatchId, orderId },
    });

    if (!dispatch) {
      return sendErrorResponse(res, 404, "Dispatch not found for this order");
    }

    const fileUrl =
      type === "invoice" ? dispatch.invoiceLink : dispatch.gatePassLink;

    if (!fileUrl) {
      return sendErrorResponse(
        res,
        404,
        `Dispatch #${dispatch.dispatchNumber} has no ${
          type === "invoice" ? "invoice" : "gate-pass"
        } attached`,
      );
    }

    const filename = path.basename(fileUrl);

    const response = await axios.get(fileUrl, {
      responseType: "stream",
    });

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "application/octet-stream",
    );

    response.data.pipe(res);

    response.data.on("end", () => res.end());
    response.data.on("error", () => res.status(500).end());
  } catch (err) {
    return sendErrorResponse(
      res,
      500,
      "Failed to download dispatch document",
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
