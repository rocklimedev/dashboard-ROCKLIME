const {
  Op,
  sequelize,
  moment,
  Order,
  User,
  Customer,
  Team,
  Quotation,
  Product,
  OrderItem,
  Address,
  sendNotification,
  logActivity,
  ADMIN_USER_ID,
  VALID_STATUSES,
  VALID_PRIORITIES,
  sendErrorResponse,
  computeTotals,
  reduceStockAndLog,
  restoreStock,
} = require("./orders.helpers");

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

    if (!order) {
      return sendErrorResponse(res, 404, "Order not found");
    }

    // ── STATUS ──
    if (updates.status) {
      const norm = updates.status.toUpperCase();
      if (!VALID_STATUSES.includes(norm)) {
        return sendErrorResponse(res, 400, `Invalid status: ${updates.status}`);
      }
      if (norm === "DISPATCHED" && !order.gatePassLink?.trim()) {
        return sendErrorResponse(
          res,
          400,
          "Gate-pass required before dispatching",
        );
      }
      updates.status = norm;
    }

    // ── PRIORITY ──
    if (updates.priority) {
      const p = updates.priority.toLowerCase();
      if (!VALID_PRIORITIES.includes(p)) {
        return sendErrorResponse(
          res,
          400,
          `Invalid priority: ${updates.priority}`,
        );
      }
      updates.priority = p;
    }

    // ── DATES ──
    if (updates.dueDate !== undefined) {
      if (
        updates.dueDate &&
        !moment(updates.dueDate, "YYYY-MM-DD", true).isValid()
      ) {
        return sendErrorResponse(
          res,
          400,
          "Invalid dueDate format (YYYY-MM-DD)",
        );
      }
      updates.dueDate = updates.dueDate || null;
    }

    if (updates.followupDates !== undefined) {
      if (!Array.isArray(updates.followupDates)) {
        return sendErrorResponse(res, 400, "followupDates must be an array");
      }
      const validDates = updates.followupDates.filter(
        (d) => d && moment(d, "YYYY-MM-DD", true).isValid(),
      );
      updates.followupDates = validDates.length > 0 ? validDates : null;
    }

    // ── TEAM / USERS ──
    if (updates.assignedTeamId !== undefined) {
      updates.assignedTeamId = updates.assignedTeamId || null;
      if (updates.assignedTeamId) {
        const team = await Team.findByPk(updates.assignedTeamId);
        if (!team)
          return sendErrorResponse(res, 404, "Assigned team not found");
      }
    }

    if (updates.assignedUserId !== undefined) {
      updates.assignedUserId = updates.assignedUserId || null;
      if (updates.assignedUserId) {
        const user = await User.findByPk(updates.assignedUserId);
        if (!user)
          return sendErrorResponse(res, 404, "Assigned user not found");
      }
    }

    if (updates.secondaryUserId !== undefined) {
      updates.secondaryUserId = updates.secondaryUserId || null;
      if (updates.secondaryUserId) {
        const user = await User.findByPk(updates.secondaryUserId);
        if (!user)
          return sendErrorResponse(res, 404, "Secondary user not found");
      }
    }

    // ── ORDER NUMBER ──
    if (updates.orderNo !== undefined) {
      const newNo = parseInt(updates.orderNo);
      if (isNaN(newNo) || newNo <= 0) {
        return sendErrorResponse(res, 400, "orderNo must be a positive number");
      }
      const conflict = await Order.findOne({
        where: { orderNo: newNo, id: { [Op.ne]: id } },
      });
      if (conflict)
        return sendErrorResponse(res, 400, "Order number already exists");
      updates.orderNo = newNo;
    }

    // ── MASTER / PREVIOUS / QUOTATION ──
    if (updates.masterPipelineNo !== undefined) {
      if (!updates.masterPipelineNo) updates.masterPipelineNo = null;
      else {
        const m = await Order.findOne({
          where: { orderNo: updates.masterPipelineNo },
        });
        if (!m) return sendErrorResponse(res, 404, "Master order not found");
        if (updates.masterPipelineNo === order.orderNo) {
          return sendErrorResponse(
            res,
            400,
            "Master cannot be the same as current order",
          );
        }
      }
    }

    if (updates.previousOrderNo !== undefined) {
      if (!updates.previousOrderNo) updates.previousOrderNo = null;
      else {
        const p = await Order.findOne({
          where: { orderNo: updates.previousOrderNo },
        });
        if (!p) return sendErrorResponse(res, 404, "Previous order not found");
        if (updates.previousOrderNo === order.orderNo) {
          return sendErrorResponse(
            res,
            400,
            "Previous cannot be the same as current order",
          );
        }
      }
    }

    if (updates.quotationId !== undefined) {
      updates.quotationId = updates.quotationId || null;
      if (updates.quotationId) {
        const q = await Quotation.findByPk(updates.quotationId);
        if (!q) return sendErrorResponse(res, 404, "Quotation not found");
      }
    }

    // ── PRODUCTS (FULL REPLACE) ──
    let newProductUpdates = [];

    if (updates.products !== undefined) {
      if (updates.products === null || updates.products === "") {
        updates.products = [];
      } else if (!Array.isArray(updates.products)) {
        return sendErrorResponse(res, 400, "products must be an array");
      }

      for (const p of updates.products) {
        const {
          id,
          price,
          quantity,
          total,
          discount = 0,
          discountType, // ← optional
        } = p;

        if (
          !id ||
          price == null ||
          quantity == null ||
          total == null ||
          quantity < 1
        ) {
          return sendErrorResponse(
            res,
            400,
            "Each product needs id, price, quantity, and total",
          );
        }

        const prod = await Product.findByPk(id);
        if (!prod)
          return sendErrorResponse(res, 404, `Product not found: ${id}`);

        const finalDiscountType =
          discountType || prod.discountType || "percent";
        const calculatedTotal =
          finalDiscountType === "percent"
            ? price * (1 - discount / 100) * quantity
            : (price - discount) * quantity;

        if (Math.abs(total - calculatedTotal) > 0.01) {
          return sendErrorResponse(
            res,
            400,
            `Invalid total for product ${id}. Expected ${calculatedTotal.toFixed(
              2,
            )}`,
          );
        }

        const oldQty = order.products?.find((x) => x.id === id)?.quantity || 0;
        if (prod.quantity + oldQty < quantity) {
          return sendErrorResponse(
            res,
            400,
            `Insufficient stock for ${prod.name}`,
          );
        }

        newProductUpdates.push({
          productId: id,
          quantityToReduce: quantity,
          productRecord: prod,
        });
      }
    }

    // ── FINANCIAL FIELDS ──
    if (updates.shipping !== undefined) {
      const s = parseFloat(updates.shipping) || 0;
      if (s < 0) return sendErrorResponse(res, 400, "Invalid shipping");
      updates.shipping = s;
    }

    if (updates.gst !== undefined) {
      const g = updates.gst === "" ? null : parseFloat(updates.gst);
      if (g !== null && (isNaN(g) || g < 0 || g > 100)) {
        return sendErrorResponse(res, 400, "GST must be 0–100");
      }
      updates.gst = g;
    }

    if (updates.extraDiscount !== undefined) {
      // Allow: null, undefined, empty string → treat as no discount (null)
      if (
        updates.extraDiscount === null ||
        updates.extraDiscount === undefined ||
        updates.extraDiscount === ""
      ) {
        updates.extraDiscount = null;
        updates.extraDiscountType = null; // optional: clear type too
      } else {
        const parsed = parseFloat(updates.extraDiscount);
        if (isNaN(parsed) || parsed < 0) {
          return sendErrorResponse(
            res,
            400,
            "Extra discount must be a positive number or zero",
          );
        }
        updates.extraDiscount = parsed;
      }
    }

    if (updates.extraDiscountType !== undefined) {
      if (updates.extraDiscount == null || updates.extraDiscount === 0) {
        updates.extraDiscountType = null;
      } else if (!["fixed", "percent"].includes(updates.extraDiscountType)) {
        return sendErrorResponse(
          res,
          400,
          "extraDiscountType must be 'fixed' or 'percent'",
        );
      }
    }
    if (updates.amountPaid !== undefined) {
      const a = parseFloat(updates.amountPaid) || 0;
      if (isNaN(a) || a < 0)
        return sendErrorResponse(res, 400, "Invalid amountPaid");
      updates.amountPaid = a;
    }

    // ── RECALCULATE TOTALS ──
    const calcInput = {
      products: updates.products ?? order.products ?? [],
      shipping: updates.shipping ?? order.shipping ?? 0,
      gst: updates.gst ?? order.gst ?? 0,
      extraDiscount: updates.extraDiscount ?? order.extraDiscount ?? 0,
      extraDiscountType:
        updates.extraDiscountType ?? order.extraDiscountType ?? "fixed",
      amountPaid: updates.amountPaid ?? order.amountPaid ?? 0,
    };

    const { gstValue, extraDiscountValue, finalAmount } =
      computeTotals(calcInput);
    updates.gstValue = gstValue;
    updates.extraDiscountValue = extraDiscountValue;
    updates.finalAmount = finalAmount;

    // ── STOCK: Restore old → Deduct new ──
    if (newProductUpdates.length > 0) {
      if (order.products && order.products.length > 0) {
        await restoreStock({
          products: order.products,
          orderNo: order.orderNo,
        });
      }
      await reduceStockAndLog({
        productUpdates: newProductUpdates,
        createdBy: order.createdBy,
        orderNo: order.orderNo,
      });
    }

    // ── SAVE TO MYSQL ──
    await order.update(updates);
    await order.reload();
    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "UPDATE_ORDER",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Order ${order.orderNo} updated`,

      metadata: {
        orderNo: order.orderNo,

        // ── CORE CHANGES ──
        changedFields: Object.keys(updates),

        // ── BUSINESS IMPACT ──
        status: updates.status || order.status,
        priority: updates.priority || order.priority,
        finalAmount: updates.finalAmount,

        // ── FINANCIAL DIFF ──
        financialChange: {
          shipping: updates.shipping,
          gst: updates.gst,
          extraDiscount: updates.extraDiscount,
          amountPaid: updates.amountPaid,
        },

        // ── PRODUCT IMPACT ──
        productsChanged: !!updates.products,
        productCount: updates.products?.length || order.products?.length || 0,

        // ── INVENTORY IMPACT ──
        stockRecalculated: newProductUpdates.length > 0,
        stockRestored:
          Array.isArray(order.products) && order.products.length > 0,
      },

      req,
    });
    // ── UPDATE MONGODB ORDER ITEMS (only if products changed) ──
    if (updates.products && updates.products.length > 0) {
      const productIds = updates.products
        .map((p) => p.id || p.productId)
        .filter(Boolean);

      const dbProducts = await Product.findAll({
        where: { productId: productIds },
        attributes: ["productId", "name", "images"],
      });

      const productMap = {};
      dbProducts.forEach((p) => {
        let imageUrl = null;
        if (p.images) {
          try {
            const imgs = JSON.parse(p.images);
            if (Array.isArray(imgs) && imgs.length > 0) imageUrl = imgs[0];
          } catch (e) {}
        }
        productMap[p.productId] = {
          name: p.name || "Unknown Product",
          imageUrl,
        };
      });

      const mongoItems = updates.products.map((p) => {
        const id = p.id || p.productId;
        const { name, imageUrl } = productMap[id] || {
          name: "Unknown Product",
          imageUrl: null,
        };
        return {
          productId: id,
          name,
          imageUrl,
          quantity: p.quantity,
          price: p.price,
          discount: p.discount ?? 0,
          discountType: p.discountType || "percent",
          tax: 0,
          total: p.total,
        };
      });

      await OrderItem.findOneAndUpdate(
        { orderId: order.id },
        { orderId: order.id, items: mongoItems },
        { upsert: true },
      );
    }

    // ── NOTIFICATIONS ──
    const customerName = order.customer?.name || "Customer";
    const addr = order.shippingAddress
      ? `, ship to ${order.shippingAddress.street || ""}`
      : "";

    const recipients = new Set(
      [
        order.createdBy,
        updates.assignedUserId ?? order.assignedUserId,
        updates.secondaryUserId ?? order.secondaryUserId,
      ].filter(Boolean),
    );

    for (const uid of recipients) {
      await sendNotification({
        userId: uid,
        title: `Order Updated #${order.orderNo}`,
        message: `Order #${order.orderNo} for ${customerName}${addr} updated.`,
      });
    }

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Order #${order.orderNo} Updated`,
      message: `Order updated by ${req.user?.name || "someone"}.`,
    });

    return res.status(200).json({
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to update order", err.message);
  }
};

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

    // GATE-PASS REQUIRED FOR DISPATCHED
    if (norm === "DISPATCHED" && !order.gatePassLink) {
      return sendErrorResponse(
        res,
        400,
        "Gate-pass must be uploaded before dispatching the order",
      );
    }

    const oldStatus = order.status;
    order.status = norm;
    await order.save();

    // Restore stock on CANCELED / CLOSED
    if (["CANCELED", "CLOSED"].includes(norm) && order.products?.length) {
      await restoreStock({ products: order.products, orderNo: order.orderNo });
    }

    // ── ACTIVITY LOG ──
    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "ORDER_STATUS_UPDATE",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Order ${order.orderNo} status changed: ${oldStatus} → ${norm}`,

      metadata: {
        orderNo: order.orderNo,
        customerName: order.customer?.name || null,

        statusChange: {
          from: oldStatus,
          to: norm,
        },

        gatePassRequired: norm === "DISPATCHED",

        productCount: order.products?.length || 0,
      },

      req,
    });
    // ── NOTIFICATIONS ──
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
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
      message: `Order #${order.orderNo} changed from ${oldStatus} → ${norm}.`,
    });

    return res.status(200).json({ message: "Status updated", order });
  } catch (err) {
    return sendErrorResponse(res, 500, "Failed to update status", err.message);
  }
};

// GET /api/orders/:id/download-invoice

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
        (id) => id,
      ),
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
      err.message,
    );
  }
};

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
        "Order referenced by other orders – cannot delete",
      );

    // restore stock
    if (order.products?.length) {
      await restoreStock({ products: order.products, orderNo: order.orderNo });
    }

    // notifications
    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(
        Boolean,
      ),
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
    // ── ACTIVITY LOG ──
    await logActivity({
      userId: req.user?.userId || order.createdBy,
      contextTag: "SALES",
      subContext: "ORDER",
      action: "DELETE_ORDER",
      entityId: order.id,
      entityName: order.orderNo,
      description: `Order ${order.orderNo} deleted`,

      oldValues: {
        orderId: order.id,
        orderNo: order.orderNo,
        customerName: order.customer?.name,
        finalAmount: order.finalAmount,
        status: order.status,
        productCount: order.products?.length || 0,
      },

      metadata: {
        mongoCleaned: true,
        dependencyBlocked: deps.length > 0,
      },

      req,
    });
    return res.status(200).json({ message: "Order deleted" });
  } catch (err) {
    return sendErrorResponse(res, 500, "Delete failed", err.message);
  }
};

// ──────── DRAFT ORDER (now also accepts amountPaid) ────────
