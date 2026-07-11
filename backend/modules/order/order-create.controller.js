const sequelize = require("../config/database");
const { User, Order, Customer, Quotation, Product } = require("../models");
const OrderItem = require("../models/orderItem");
const { sendErrorResponse } = require("../utils/response.util");
const { computeTotals } = require("../services/calculation.service");
const { generateDailyOrderNumber } = require("../services/orderNumber.service");
const { reduceStockAndLog } = require("../services/inventory.service");
const { sendNotification } = require("./notificationController");
const logActivity = require("../utils/activityLogger");
const { ADMIN_USER_ID } = require("../config/constants");

// ──────── CREATE ORDER ────────
exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();

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
      quotationId,
      masterPipelineNo,
      previousOrderNo,
      shipTo,
      shipping = 0,
      message: customMessage,
      gst = null,
      extraDiscount = null,
      extraDiscountType = "fixed",
      amountPaid = 0,
      products = [],
    } = req.body;

    // ── BASIC VALIDATION ──
    if (!createdFor || !createdBy) {
      await t.rollback();
      return sendErrorResponse(
        res,
        400,
        "createdFor and createdBy are required",
      );
    }

    if (!Array.isArray(products) || products.length === 0) {
      await t.rollback();
      return sendErrorResponse(
        res,
        400,
        "Cannot create order without products",
      );
    }

    // ── VALIDATE USER & CUSTOMER ──
    const [creator, customer] = await Promise.all([
      User.findByPk(createdBy, {
        attributes: ["userId", "username", "name"],
        transaction: t,
      }),
      Customer.findByPk(createdFor, { transaction: t }),
    ]);

    if (!creator) {
      await t.rollback();
      return sendErrorResponse(res, 404, "Creator user not found");
    }

    if (!customer) {
      await t.rollback();
      return sendErrorResponse(res, 404, "Customer not found");
    }

    // ── OPTIONAL VALIDATIONS ──
    if (quotationId) {
      const quotation = await Quotation.findByPk(quotationId, {
        transaction: t,
      });
      if (!quotation) {
        await t.rollback();
        return sendErrorResponse(res, 404, "Quotation not found");
      }
    }

    if (masterPipelineNo) {
      const masterOrder = await Order.findOne({
        where: { orderNo: masterPipelineNo },
        transaction: t,
      });
      if (!masterOrder) {
        await t.rollback();
        return sendErrorResponse(
          res,
          404,
          `Master order ${masterPipelineNo} not found`,
        );
      }
    }

    if (previousOrderNo) {
      const previousOrder = await Order.findOne({
        where: { orderNo: previousOrderNo },
        transaction: t,
      });
      if (!previousOrder) {
        await t.rollback();
        return sendErrorResponse(
          res,
          404,
          `Previous order ${previousOrderNo} not found`,
        );
      }
    }

    // ── PRODUCT IDS ──
    const productIds = products.map((p) => p.id || p.productId).filter(Boolean);

    // Sort before locking to prevent deadlocks on concurrent orders
    const sortedProductIds = [...new Set(productIds)].sort();

    // ── FETCH PRODUCT METADATA ──
    const dbProducts = await Product.findAll({
      where: { productId: sortedProductIds },
      attributes: ["productId", "name", "images", "meta", "product_code"],
      transaction: t,
    });

    const productMap = {};
    dbProducts.forEach((p) => {
      let imageUrl = "";
      if (p.images) {
        try {
          const imgs =
            typeof p.images === "string" ? JSON.parse(p.images) : p.images;
          if (Array.isArray(imgs) && imgs.length > 0) {
            imageUrl = imgs[0]?.url || imgs[0] || "";
          }
        } catch (e) {
          console.warn(`Failed to parse images for product ${p.productId}`, e);
        }
      }

      productMap[p.productId] = {
        name: p.name || "Unknown Product",
        imageUrl,
        productCode: p.product_code || "",
        companyCode:
          (p.meta && p.meta["d11da9f9-3f2e-4536-8236-9671200cca4a"]) || "",
      };
    });

    // ── LOCK PRODUCTS IN CONSISTENT ORDER ──
    const lockedProducts = {};
    for (const productId of sortedProductIds) {
      const product = await Product.findByPk(productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!product) {
        await t.rollback();
        return sendErrorResponse(res, 404, `Product not found: ${productId}`);
      }

      lockedProducts[productId] = product;
    }

    // ── BUILD ORDER PRODUCTS ──
    const enrichedProducts = [];
    const productUpdates = [];

    for (const p of products) {
      const productId = p.id || p.productId;

      if (!productId) {
        await t.rollback();
        return sendErrorResponse(res, 400, "Product ID is required");
      }

      const quantity = Number(p.quantity);
      const price = Number(p.price);

      if (!quantity || quantity < 1) {
        await t.rollback();
        return sendErrorResponse(
          res,
          400,
          `Invalid quantity for product ${productId}`,
        );
      }

      if (price == null || isNaN(price)) {
        await t.rollback();
        return sendErrorResponse(
          res,
          400,
          `Invalid price for product ${productId}`,
        );
      }

      const prod = lockedProducts[productId];

      if (prod.quantity < quantity) {
        await t.rollback();
        return sendErrorResponse(
          res,
          400,
          `Insufficient stock for "${prod.name}". Requested: ${quantity}, Available: ${prod.quantity}`,
        );
      }

      const discount = Number(p.discount) || 0;
      const discountType = p.discountType || "percent";
      const tax = Number(p.tax) || 0;

      const subtotal = price * quantity;
      const discountAmount =
        discountType === "percent"
          ? (subtotal * discount) / 100
          : discount * quantity;

      const lineTotal = Number((subtotal - discountAmount).toFixed(2));

      const prodInfo = productMap[productId] || {};
      const finalImageUrl = p.imageUrl || prodInfo.imageUrl || "";
      const finalProductCode = p.productCode || prodInfo.productCode || "";
      const finalCompanyCode = p.companyCode || prodInfo.companyCode || "";

      enrichedProducts.push({
        productId,
        name: p.name || prodInfo.name || prod.name || "Unknown Product",
        imageUrl: finalImageUrl,
        productCode: finalProductCode,
        companyCode: finalCompanyCode,
        quantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax,
        total: lineTotal,
      });

      productUpdates.push({
        productId,
        quantityToReduce: quantity,
        productRecord: prod,
      });
    }

    // ── TOTALS ──
    const parsedShipping = parseFloat(shipping) || 0;
    const parsedGst = gst !== null && gst !== "" ? parseFloat(gst) : null;
    const parsedExtraDiscount =
      extraDiscount !== null && extraDiscount !== ""
        ? parseFloat(extraDiscount)
        : null;
    const finalDiscountType =
      parsedExtraDiscount !== null ? extraDiscountType : null;
    const parsedAmountPaid = parseFloat(amountPaid) || 0;

    const { gstValue, extraDiscountValue, finalAmount } = computeTotals({
      products: enrichedProducts,
      shipping: parsedShipping,
      gst: parsedGst,
      extraDiscount: parsedExtraDiscount,
      extraDiscountType: finalDiscountType,
    });

    // ── STATUS & PRIORITY ──
    const priorityLower = priority ? priority.toLowerCase() : "medium";
    const statusUpper = status ? status.toUpperCase() : "PREPARING";

    // ── GENERATE ORDER NUMBER ──
    const orderNo = await generateDailyOrderNumber(t);

    // ── CREATE ORDER ──
    const order = await Order.create(
      {
        createdFor,
        createdBy,
        status: statusUpper,
        dueDate: dueDate || null,
        followupDates: Array.isArray(followupDates)
          ? followupDates.filter(Boolean)
          : null,
        source: source || null,
        priority: priorityLower,
        description: description || null,
        orderNo,
        quotationId: quotationId || null,
        masterPipelineNo: masterPipelineNo || null,
        previousOrderNo: previousOrderNo || null,
        shipTo: shipTo || null,
        shipping: parsedShipping,
        assignedTeamId: assignedTeamId || null,
        assignedUserId: assignedUserId || null,
        secondaryUserId: secondaryUserId || null,
        gst: parsedGst,
        gstValue,
        extraDiscount: parsedExtraDiscount,
        extraDiscountType: finalDiscountType,
        extraDiscountValue,
        amountPaid: parsedAmountPaid,
        finalAmount,
        products: enrichedProducts,
      },
      { transaction: t },
    );

    // ── REDUCE STOCK ──
    if (productUpdates.length > 0) {
      await reduceStockAndLog({
        productUpdates,
        createdBy,
        orderNo: order.orderNo,
        customMessage,
        transaction: t,
      });
    }

    // ── COMMIT ──
    await t.commit();

    await logActivity({
      userId: createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "CREATE_ORDER",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Order ${order.orderNo} created for ${customer.name}`,
      metadata: {
        orderNo: order.orderNo,
        customerId: createdFor,
        customerName: customer.name,
        totalAmount: finalAmount,
        productCount: enrichedProducts.length,
        priority: priorityLower,
        status: statusUpper,
        shipping: parsedShipping,
        gst: parsedGst,
        extraDiscount: parsedExtraDiscount,
        assignedUserId,
        secondaryUserId,
      },
      req,
    });

    // ── SAVE TO MONGODB ──
    try {
      await OrderItem.findOneAndUpdate(
        { orderId: order.id },
        {
          orderId: order.id,
          items: enrichedProducts.map((p) => ({
            productId: p.productId,
            name: p.name,
            imageUrl: p.imageUrl,
            productCode: p.productCode,
            companyCode: p.companyCode,
            quantity: p.quantity,
            price: p.price,
            discount: p.discount,
            discountType: p.discountType,
            tax: p.tax,
            total: p.total,
          })),
        },
        { upsert: true },
      );
    } catch (mongoErr) {
      console.error("MongoDB save error:", mongoErr);
    }

    // ── NOTIFICATIONS ──
    const recipients = new Set(
      [createdBy, assignedUserId, secondaryUserId].filter(Boolean),
    );

    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `New Order #${order.orderNo}`,
        message: `Order #${order.orderNo} created for ${customer.name}.`,
      });
    }

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New Order #${order.orderNo}`,
      message: `Order #${order.orderNo} created by ${creator.name} for ${customer.name}.`,
    });

    // ── SUCCESS RESPONSE ──
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      id: order.id,
      orderNo: order.orderNo,
    });
  } catch (err) {
    try {
      await t.rollback();
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr);
    }

    if (
      err.name === "SequelizeDatabaseError" &&
      err.message?.toLowerCase().includes("deadlock")
    ) {
      return sendErrorResponse(
        res,
        409,
        "Database deadlock detected. Please retry the order creation.",
      );
    }

    if (err.message?.toLowerCase().includes("lock wait timeout")) {
      return sendErrorResponse(
        res,
        409,
        "Database is busy processing another order. Please try again.",
      );
    }

    return sendErrorResponse(res, 500, "Failed to create order", err.message);
  }
};
