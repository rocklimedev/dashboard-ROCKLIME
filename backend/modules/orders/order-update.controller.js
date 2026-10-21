const {
  OrderItem,
  Op,
  sequelize,
  moment,
  sendNotification,
  User,
  Order,
  Team,
  Customer,
  Quotation,
  Address,
  Product,
  logActivity,
  logOrderActivity,
  VALID_STATUSES,
  VALID_PRIORITIES,
  ADMIN_USER_ID,
  stock,
  sendErrorResponse,
  computeTotals,
} = require('./order-controller.shared');

// ──────── UPDATE ORDER (by id) ────────
exports.updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const order = await Order.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Address, as: 'shippingAddress' },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    // ─────────────────────────────────────
    // CAPTURE OLD ORDER STATE
    // Used by dedicated order_activity logger
    // ─────────────────────────────────────
    const oldOrderSnapshot = {
      orderNo: order.orderNo,
      status: order.status,
      priority: order.priority,

      dueDate: order.dueDate,
      followupDates: order.followupDates,

      createdFor: order.createdFor,
      createdBy: order.createdBy,

      assignedTeamId: order.assignedTeamId,
      assignedUserId: order.assignedUserId,
      secondaryUserId: order.secondaryUserId,

      quotationId: order.quotationId,
      masterPipelineNo: order.masterPipelineNo,
      previousOrderNo: order.previousOrderNo,
      shipTo: order.shipTo,

      source: order.source,
      description: order.description,

      products: order.products,

      shipping: order.shipping,
      gst: order.gst,
      gstValue: order.gstValue,

      extraDiscount: order.extraDiscount,
      extraDiscountType: order.extraDiscountType,
      extraDiscountValue: order.extraDiscountValue,

      amountPaid: order.amountPaid,
      finalAmount: order.finalAmount,

      invoiceLink: order.invoiceLink,
      gatePassLink: order.gatePassLink,
      creditNoteLink: order.creditNoteLink,
      receivingDocumentLink: order.receivingDocumentLink,
    };

    // ─────────────────────────────────────
    // STATUS
    // ─────────────────────────────────────
    if (updates.status) {
      const norm = updates.status.toUpperCase();

      if (!VALID_STATUSES.includes(norm)) {
        return sendErrorResponse(res, 400, `Invalid status: ${updates.status}`);
      }

      // Invoice is mandatory before ANY dispatch status.
      if (['DISPATCHED', 'PARTIALLY_DISPATCHED'].includes(norm) && !order.invoiceLink?.trim()) {
        return sendErrorResponse(res, 400, 'Invoice must be uploaded before dispatching the order');
      }

      // Gate-pass is also required when manually changing
      // the order status to a dispatched state.
      if (['DISPATCHED', 'PARTIALLY_DISPATCHED'].includes(norm) && !order.gatePassLink?.trim()) {
        return sendErrorResponse(res, 400, 'Gate-pass required before dispatching');
      }

      updates.status = norm;
    }

    // ─────────────────────────────────────
    // PRIORITY
    // ─────────────────────────────────────
    if (updates.priority) {
      const p = updates.priority.toLowerCase();

      if (!VALID_PRIORITIES.includes(p)) {
        return sendErrorResponse(res, 400, `Invalid priority: ${updates.priority}`);
      }

      updates.priority = p;
    }

    // ─────────────────────────────────────
    // DATES
    // ─────────────────────────────────────
    if (updates.dueDate !== undefined) {
      if (updates.dueDate && !moment(updates.dueDate, 'YYYY-MM-DD', true).isValid()) {
        return sendErrorResponse(res, 400, 'Invalid dueDate format (YYYY-MM-DD)');
      }

      updates.dueDate = updates.dueDate || null;
    }

    if (updates.followupDates !== undefined) {
      if (!Array.isArray(updates.followupDates)) {
        return sendErrorResponse(res, 400, 'followupDates must be an array');
      }

      const validDates = updates.followupDates.filter(
        (d) => d && moment(d, 'YYYY-MM-DD', true).isValid(),
      );

      updates.followupDates = validDates.length > 0 ? validDates : null;
    }

    // ─────────────────────────────────────
    // TEAM / USERS
    // ─────────────────────────────────────
    if (updates.assignedTeamId !== undefined) {
      updates.assignedTeamId = updates.assignedTeamId || null;

      if (updates.assignedTeamId) {
        const team = await Team.findByPk(updates.assignedTeamId);

        if (!team) {
          return sendErrorResponse(res, 404, 'Assigned team not found');
        }
      }
    }

    if (updates.assignedUserId !== undefined) {
      updates.assignedUserId = updates.assignedUserId || null;

      if (updates.assignedUserId) {
        const user = await User.findByPk(updates.assignedUserId);

        if (!user) {
          return sendErrorResponse(res, 404, 'Assigned user not found');
        }
      }
    }

    if (updates.secondaryUserId !== undefined) {
      updates.secondaryUserId = updates.secondaryUserId || null;

      if (updates.secondaryUserId) {
        const user = await User.findByPk(updates.secondaryUserId);

        if (!user) {
          return sendErrorResponse(res, 404, 'Secondary user not found');
        }
      }
    }

    // ─────────────────────────────────────
    // ORDER NUMBER
    // ─────────────────────────────────────
    if (updates.orderNo !== undefined) {
      const newNo = parseInt(updates.orderNo);

      if (isNaN(newNo) || newNo <= 0) {
        return sendErrorResponse(res, 400, 'orderNo must be a positive number');
      }

      const conflict = await Order.findOne({
        where: {
          orderNo: newNo,
          id: { [Op.ne]: id },
        },
      });

      if (conflict) {
        return sendErrorResponse(res, 400, 'Order number already exists');
      }

      updates.orderNo = newNo;
    }

    // ─────────────────────────────────────
    // MASTER PIPELINE / PREVIOUS / QUOTATION
    // ─────────────────────────────────────
    if (updates.masterPipelineNo !== undefined) {
      if (!updates.masterPipelineNo) {
        updates.masterPipelineNo = null;
      } else {
        const m = await Order.findOne({
          where: {
            orderNo: updates.masterPipelineNo,
          },
        });

        if (!m) {
          return sendErrorResponse(res, 404, 'Master order not found');
        }

        if (updates.masterPipelineNo === order.orderNo) {
          return sendErrorResponse(res, 400, 'Master cannot be the same as current order');
        }
      }
    }

    if (updates.previousOrderNo !== undefined) {
      if (!updates.previousOrderNo) {
        updates.previousOrderNo = null;
      } else {
        const p = await Order.findOne({
          where: {
            orderNo: updates.previousOrderNo,
          },
        });

        if (!p) {
          return sendErrorResponse(res, 404, 'Previous order not found');
        }

        if (updates.previousOrderNo === order.orderNo) {
          return sendErrorResponse(res, 400, 'Previous cannot be the same as current order');
        }
      }
    }

    if (updates.quotationId !== undefined) {
      updates.quotationId = updates.quotationId || null;

      if (updates.quotationId) {
        const q = await Quotation.findByPk(updates.quotationId);

        if (!q) {
          return sendErrorResponse(res, 404, 'Quotation not found');
        }
      }
    }

    // ─────────────────────────────────────
    // PRODUCTS (FULL REPLACE)
    // ─────────────────────────────────────
    let newProductUpdates = [];

    if (updates.products !== undefined) {
      if (updates.products === null || updates.products === '') {
        updates.products = [];
      } else if (!Array.isArray(updates.products)) {
        return sendErrorResponse(res, 400, 'products must be an array');
      }

      for (const p of updates.products) {
        const { id, price, quantity, total, discount = 0, discountType } = p;

        if (!id || price == null || quantity == null || total == null || quantity < 1) {
          return sendErrorResponse(res, 400, 'Each product needs id, price, quantity, and total');
        }

        const prod = await Product.findByPk(id);

        if (!prod) {
          return sendErrorResponse(res, 404, `Product not found: ${id}`);
        }

        const finalDiscountType = discountType || prod.discountType || 'percent';

        const calculatedTotal =
          finalDiscountType === 'percent'
            ? price * (1 - discount / 100) * quantity
            : (price - discount) * quantity;

        if (Math.abs(total - calculatedTotal) > 0.01) {
          return sendErrorResponse(
            res,
            400,
            `Invalid total for product ${id}. Expected ${calculatedTotal.toFixed(2)}`,
          );
        }

        newProductUpdates.push({
          productId: id,
          quantityToReduce: quantity,
          productRecord: prod,
        });
      }
    }

    // ─────────────────────────────────────
    // FINANCIAL FIELDS
    // ─────────────────────────────────────
    if (updates.shipping !== undefined) {
      const s = parseFloat(updates.shipping) || 0;

      if (s < 0) {
        return sendErrorResponse(res, 400, 'Invalid shipping');
      }

      updates.shipping = s;
    }

    if (updates.gst !== undefined) {
      const g = updates.gst === '' ? null : parseFloat(updates.gst);

      if (g !== null && (isNaN(g) || g < 0 || g > 100)) {
        return sendErrorResponse(res, 400, 'GST must be 0–100');
      }

      updates.gst = g;
    }

    if (updates.extraDiscount !== undefined) {
      if (
        updates.extraDiscount === null ||
        updates.extraDiscount === undefined ||
        updates.extraDiscount === ''
      ) {
        updates.extraDiscount = null;
        updates.extraDiscountType = null;
      } else {
        const parsed = parseFloat(updates.extraDiscount);

        if (isNaN(parsed) || parsed < 0) {
          return sendErrorResponse(res, 400, 'Extra discount must be a positive number or zero');
        }

        updates.extraDiscount = parsed;
      }
    }

    if (updates.extraDiscountType !== undefined) {
      if (updates.extraDiscount == null || updates.extraDiscount === 0) {
        updates.extraDiscountType = null;
      } else if (!['fixed', 'percent'].includes(updates.extraDiscountType)) {
        return sendErrorResponse(res, 400, "extraDiscountType must be 'fixed' or 'percent'");
      }
    }

    // Amount paid is the sum of recorded payments (Accounts app); it is not edited here.
    delete updates.amountPaid;

    // ─────────────────────────────────────
    // RECALCULATE TOTALS
    // ─────────────────────────────────────
    const calcInput = {
      products: updates.products ?? order.products ?? [],

      shipping: updates.shipping ?? order.shipping ?? 0,

      gst: updates.gst ?? order.gst ?? 0,

      extraDiscount: updates.extraDiscount ?? order.extraDiscount ?? 0,

      extraDiscountType: updates.extraDiscountType ?? order.extraDiscountType ?? 'fixed',

      amountPaid: updates.amountPaid ?? order.amountPaid ?? 0,
    };

    const { gstValue, extraDiscountValue, finalAmount } = computeTotals(calcInput);

    updates.gstValue = gstValue;
    updates.extraDiscountValue = extraDiscountValue;
    updates.finalAmount = finalAmount;

    // ─────────────────────────────────────
    // SAVE, THEN BRING RESERVATIONS IN LINE
    // (new lines reserve, removed lines release, status decides holding)
    // ─────────────────────────────────────
    if (updates.status !== undefined) {
      updates.status = String(updates.status).toUpperCase();
    }
    let stockStatus = null;
    await sequelize.transaction(async (t) => {
      await order.update(updates, { transaction: t });
      stockStatus = await stock.syncOrder(order.id, {
        t,
        userId: req.user?.userId || null,
      });
    });
    await order.reload();

    // ─────────────────────────────────────
    // CAPTURE NEW ORDER STATE
    // ─────────────────────────────────────
    const newOrderSnapshot = {
      orderNo: order.orderNo,
      status: order.status,
      priority: order.priority,

      dueDate: order.dueDate,
      followupDates: order.followupDates,

      createdFor: order.createdFor,
      createdBy: order.createdBy,

      assignedTeamId: order.assignedTeamId,
      assignedUserId: order.assignedUserId,
      secondaryUserId: order.secondaryUserId,

      quotationId: order.quotationId,
      masterPipelineNo: order.masterPipelineNo,
      previousOrderNo: order.previousOrderNo,
      shipTo: order.shipTo,

      source: order.source,
      description: order.description,

      products: order.products,

      shipping: order.shipping,
      gst: order.gst,
      gstValue: order.gstValue,

      extraDiscount: order.extraDiscount,
      extraDiscountType: order.extraDiscountType,
      extraDiscountValue: order.extraDiscountValue,

      amountPaid: order.amountPaid,
      finalAmount: order.finalAmount,

      invoiceLink: order.invoiceLink,
      gatePassLink: order.gatePassLink,
      creditNoteLink: order.creditNoteLink,
      receivingDocumentLink: order.receivingDocumentLink,
    };

    // ─────────────────────────────────────
    // CHANGED FIELDS
    // ─────────────────────────────────────
    const changedFields = Object.keys(updates).filter((field) => {
      const oldValue = oldOrderSnapshot[field];

      const newValue = newOrderSnapshot[field];

      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    });

    // ─────────────────────────────────────
    // GENERIC ACTIVITY LOG
    // ─────────────────────────────────────
    await logActivity({
      userId: req.user?.userId || order.createdBy,

      contextTag: 'SALES',
      subContext: 'ORDER',
      action: 'UPDATE_ORDER',

      entityId: order.id,
      entityName: order.orderNo,

      description: `Order ${order.orderNo} updated`,

      metadata: {
        orderNo: order.orderNo,

        changedFields,

        status: updates.status || order.status,

        priority: updates.priority || order.priority,

        finalAmount: updates.finalAmount,

        financialChange: {
          shipping: updates.shipping,
          gst: updates.gst,
          extraDiscount: updates.extraDiscount,
          amountPaid: updates.amountPaid,
        },

        productsChanged: !!updates.products,

        productCount: updates.products?.length || order.products?.length || 0,

        stockRecalculated: newProductUpdates.length > 0,

        stockRestored:
          Array.isArray(oldOrderSnapshot.products) && oldOrderSnapshot.products.length > 0,
      },

      req,
    });

    // ─────────────────────────────────────
    // DEDICATED ORDER ACTIVITY LOG
    // ─────────────────────────────────────
    if (changedFields.length > 0) {
      await logOrderActivity({
        orderId: order.id,
        orderNo: order.orderNo,

        action: 'ORDER_UPDATED',

        description: `Order ${order.orderNo} updated: ${changedFields.join(', ')}`,

        oldValue: oldOrderSnapshot,

        newValue: newOrderSnapshot,

        performedBy: req.user?.userId || order.createdBy,

        metadata: {
          changedFields,

          statusChanged: oldOrderSnapshot.status !== newOrderSnapshot.status,

          priorityChanged: oldOrderSnapshot.priority !== newOrderSnapshot.priority,

          productsChanged:
            JSON.stringify(oldOrderSnapshot.products) !== JSON.stringify(newOrderSnapshot.products),

          financialChanged:
            oldOrderSnapshot.shipping !== newOrderSnapshot.shipping ||
            oldOrderSnapshot.gst !== newOrderSnapshot.gst ||
            oldOrderSnapshot.extraDiscount !== newOrderSnapshot.extraDiscount ||
            oldOrderSnapshot.amountPaid !== newOrderSnapshot.amountPaid ||
            oldOrderSnapshot.finalAmount !== newOrderSnapshot.finalAmount,

          assignmentChanged:
            oldOrderSnapshot.assignedUserId !== newOrderSnapshot.assignedUserId ||
            oldOrderSnapshot.secondaryUserId !== newOrderSnapshot.secondaryUserId ||
            oldOrderSnapshot.assignedTeamId !== newOrderSnapshot.assignedTeamId,

          invoiceChanged: oldOrderSnapshot.invoiceLink !== newOrderSnapshot.invoiceLink,

          gatePassChanged: oldOrderSnapshot.gatePassLink !== newOrderSnapshot.gatePassLink,

          stockRecalculated: newProductUpdates.length > 0,

          stockRestored:
            Array.isArray(oldOrderSnapshot.products) && oldOrderSnapshot.products.length > 0,
        },

        req,
      });
    }

    // ─────────────────────────────────────
    // UPDATE MONGODB ORDER ITEMS
    // Only if products changed
    // ─────────────────────────────────────
    if (updates.products && updates.products.length > 0) {
      const productIds = updates.products.map((p) => p.id || p.productId).filter(Boolean);

      const dbProducts = await Product.findAll({
        where: {
          productId: productIds,
        },

        attributes: ['productId', 'name', 'images'],
      });

      const productMap = {};

      dbProducts.forEach((p) => {
        let imageUrl = null;

        if (p.images) {
          try {
            const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;

            if (Array.isArray(imgs) && imgs.length > 0) {
              imageUrl = imgs[0]?.url || imgs[0] || null;
            }
          } catch (e) {}
        }

        productMap[p.productId] = {
          name: p.name || 'Unknown Product',

          imageUrl,
        };
      });

      const mongoItems = updates.products.map((p) => {
        const productId = p.id || p.productId;

        const { name, imageUrl } = productMap[productId] || {
          name: 'Unknown Product',
          imageUrl: null,
        };

        return {
          productId,

          name,

          imageUrl,

          quantity: p.quantity,

          price: p.price,

          discount: p.discount ?? 0,

          discountType: p.discountType || 'percent',

          tax: p.tax ?? 0,

          total: p.total,
        };
      });

      await OrderItem.findOneAndUpdate(
        {
          orderId: order.id,
        },
        {
          orderId: order.id,
          items: mongoItems,
        },
        {
          upsert: true,
        },
      );
    }

    // ─────────────────────────────────────
    // NOTIFICATIONS
    // ─────────────────────────────────────
    const customerName = order.customer?.name || 'Customer';

    const addr = order.shippingAddress ? `, ship to ${order.shippingAddress.street || ''}` : '';

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

      message: `Order updated by ${req.user?.name || 'someone'}.`,
    });

    // ─────────────────────────────────────
    // SUCCESS
    // ─────────────────────────────────────
    return res.status(200).json({
      message: 'Order updated successfully',

      order,
      stock: stockStatus,
    });
  } catch (err) {
    console.error('Update Order Error:', err);
    if (err instanceof stock.StockError) {
      return sendErrorResponse(res, err.status, err.message);
    }

    return sendErrorResponse(res, 500, 'Failed to update order', err.message);
  }
};
