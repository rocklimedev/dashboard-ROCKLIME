const {
  Op,
  sequelize,
  User,
  Order,
  Customer,
  Quotation,
  Product,
  OrderItem,
  sendNotification,
  logActivity,
  ADMIN_USER_ID,
  sendErrorResponse,
  computeTotals,
  generateDailyOrderNumber,
  reduceStockAndLog,
} = require("./orders.helpers");

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

    // ─────────────────────────────────────
    // BASIC VALIDATION
    // ─────────────────────────────────────
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

    // ─────────────────────────────────────
    // VALIDATE USER & CUSTOMER
    // ─────────────────────────────────────
    const [creator, customer] = await Promise.all([
      User.findByPk(createdBy, {
        attributes: ["userId", "username", "name"],
        transaction: t,
      }),

      Customer.findByPk(createdFor, {
        transaction: t,
      }),
    ]);

    if (!creator) {
      await t.rollback();
      return sendErrorResponse(res, 404, "Creator user not found");
    }

    if (!customer) {
      await t.rollback();
      return sendErrorResponse(res, 404, "Customer not found");
    }

    // ─────────────────────────────────────
    // OPTIONAL VALIDATIONS
    // ─────────────────────────────────────
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

    // ─────────────────────────────────────
    // PRODUCT IDS
    // ─────────────────────────────────────
    const productIds = products.map((p) => p.id || p.productId).filter(Boolean);

    // IMPORTANT:
    // Sort product IDs before locking
    // Prevents deadlocks when multiple orders happen simultaneously
    const sortedProductIds = [...new Set(productIds)].sort();

    // ─────────────────────────────────────
    // FETCH PRODUCT METADATA
    // ─────────────────────────────────────
    const dbProducts = await Product.findAll({
      where: {
        productId: sortedProductIds,
      },
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

    // ─────────────────────────────────────
    // LOCK PRODUCTS IN CONSISTENT ORDER
    // ─────────────────────────────────────
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

    // ─────────────────────────────────────
    // BUILD ORDER PRODUCTS
    // ─────────────────────────────────────
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

      // ─────────────────────────────────────
      // CLEAR STOCK ERROR
      // ─────────────────────────────────────
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

    // ─────────────────────────────────────
    // TOTALS
    // ─────────────────────────────────────
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

    // ─────────────────────────────────────
    // STATUS & PRIORITY
    // ─────────────────────────────────────
    const priorityLower = priority ? priority.toLowerCase() : "medium";

    const statusUpper = status ? status.toUpperCase() : "PREPARING";

    // ─────────────────────────────────────
    // GENERATE ORDER NUMBER
    // ─────────────────────────────────────
    const orderNo = await generateDailyOrderNumber(t);

    // ─────────────────────────────────────
    // CREATE ORDER
    // ─────────────────────────────────────
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
      {
        transaction: t,
      },
    );

    // ─────────────────────────────────────
    // REDUCE STOCK
    // ─────────────────────────────────────
    if (productUpdates.length > 0) {
      await reduceStockAndLog({
        productUpdates,
        createdBy,
        orderNo: order.orderNo,
        customMessage,
        transaction: t,
      });
    }

    // ─────────────────────────────────────
    // COMMIT
    // ─────────────────────────────────────
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
    // Save to MongoDB

    // ─────────────────────────────────────
    // SAVE TO MONGODB
    // ─────────────────────────────────────
    try {
      await OrderItem.findOneAndUpdate(
        {
          orderId: order.id,
        },
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
        {
          upsert: true,
        },
      );
    } catch (mongoErr) {
      console.error("MongoDB save error:", mongoErr);
    }

    // ─────────────────────────────────────
    // NOTIFICATIONS
    // ─────────────────────────────────────
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

    // ─────────────────────────────────────
    // SUCCESS RESPONSE
    // ─────────────────────────────────────
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      id: order.id,
      orderNo: order.orderNo,
    });
  } catch (err) {
    // ALWAYS rollback if transaction not finished
    try {
      await t.rollback();
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr);
    }

    // ─────────────────────────────────────
    // DEADLOCK HANDLING
    // ─────────────────────────────────────
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

    // Lock timeout
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
          `Master order ${masterPipelineNo} not found`,
        );
    }
    if (previousOrderNo) {
      const p = await Order.findOne({ where: { orderNo: previousOrderNo } });
      if (!p)
        return sendErrorResponse(
          res,
          404,
          `Previous order ${previousOrderNo} not found`,
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
            "Each product needs id,price,discount,total",
          );
        const prod = await Product.findByPk(id);
        if (!prod)
          return sendErrorResponse(res, 404, `Product ${id} not found`);
        // line-total check
        // Use discountType from payload if exists, else fall back to DB
        const discType = p.discountType || prod.discountType || "percent";
        const expected =
          discType === "percent"
            ? price * (1 - discount / 100)
            : price - discount;
        if (Math.abs(total - expected) > 0.01)
          return sendErrorResponse(
            res,
            400,
            `Invalid total for ${id}. Expected ${expected.toFixed(2)}`,
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
        "amountPaid must be 0 for draft orders",
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
