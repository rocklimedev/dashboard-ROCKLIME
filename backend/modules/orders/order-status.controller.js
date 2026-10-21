const {
  sequelize,
  sendNotification,
  Order,
  Customer,
  OrderDispatch,
  logActivity,
  logOrderActivity,
  VALID_STATUSES,
  ADMIN_USER_ID,
  stock,
  sendErrorResponse,
} = require('./order-controller.shared');

// ──────── UPDATE STATUS ONLY ────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return sendErrorResponse(res, 400, 'id & status required');
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
        },
        {
          model: OrderDispatch,
          as: 'dispatches',
          required: false,
        },
      ],
    });

    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    const norm = status.toUpperCase();

    if (!VALID_STATUSES.includes(norm)) {
      return sendErrorResponse(res, 400, `Invalid status: ${status}`);
    }

    const oldStatus = order.status;

    // =========================================================
    // DISPATCH VALIDATION
    // =========================================================

    // Goods leave stock only through Dispatch records, so a "sent" status
    // must match what was actually dispatched.
    if (['DISPATCHED', 'DELIVERED', 'PARTIALLY_DISPATCHED'].includes(norm)) {
      const needs = await stock.orderNeeds(order);
      const remaining = needs.reduce((s, n) => s + n.needed, 0);
      const sent = needs.reduce((s, n) => s + n.dispatched, 0);
      if (norm !== 'PARTIALLY_DISPATCHED' && remaining > 0) {
        return sendErrorResponse(
          res,
          400,
          `${remaining} item(s) are not dispatched yet. Use Dispatch on the order page to send them; the status updates itself.`,
        );
      }
      if (norm === 'PARTIALLY_DISPATCHED' && sent === 0) {
        return sendErrorResponse(
          res,
          400,
          'Nothing has been dispatched yet. Use Dispatch on the order page.',
        );
      }
    }

    if (norm === 'DISPATCHED' && !order.gatePassLink?.trim()) {
      return sendErrorResponse(res, 400, 'Gate-pass must be uploaded before dispatching the order');
    }

    // =========================================================
    // CLOSED VALIDATION
    //
    // An order cannot be CLOSED until:
    //
    // 1. Invoice uploaded
    // 2. Gate-pass uploaded
    // 3. Receiving document uploaded
    // 4. All ordered quantities dispatched
    // =========================================================

    if (norm === 'CLOSED') {
      const missingDocuments = [];

      if (!order.invoiceLink?.trim()) {
        missingDocuments.push('invoice');
      }

      if (!order.gatePassLink?.trim()) {
        missingDocuments.push('gate-pass');
      }

      if (!order.receivingDocumentLink?.trim()) {
        missingDocuments.push('receiving document');
      }

      if (missingDocuments.length > 0) {
        return sendErrorResponse(
          res,
          400,
          `Order cannot be closed. Upload the following first: ${missingDocuments.join(', ')}.`,
        );
      }

      // =======================================================
      // CALCULATE DISPATCHED QUANTITY
      // =======================================================

      const dispatchedMap = {};

      for (const dispatch of order.dispatches || []) {
        for (const item of dispatch.items || []) {
          const productId = item.productId;

          if (!productId) continue;

          dispatchedMap[productId] = (dispatchedMap[productId] || 0) + Number(item.quantity || 0);
        }
      }

      const undeliveredItems = [];

      for (const product of order.products || []) {
        const productId = product.productId || product.id;

        const orderedQty = Number(product.quantity || 0);

        const dispatchedQty = Number(dispatchedMap[productId] || 0);

        const remainingQty = Math.max(orderedQty - dispatchedQty, 0);

        if (remainingQty > 0) {
          undeliveredItems.push({
            productId,
            name: product.name || 'Unknown Product',
            ordered: orderedQty,
            dispatched: dispatchedQty,
            remaining: remainingQty,
          });
        }
      }

      if (undeliveredItems.length > 0) {
        const itemSummary = undeliveredItems
          .map((item) => `${item.name}: ${item.remaining} remaining`)
          .join(', ');

        return sendErrorResponse(
          res,
          400,
          `Order cannot be closed. All items must be fully dispatched first. ${itemSummary}`,
        );
      }
    }

    // =========================================================
    // SAVE STATUS
    // =========================================================

    order.status = norm;
    await order.save();

    // =========================================================
    // STOCK RESERVATIONS
    // =========================================================

    // Reservations follow the status: confirmed statuses hold stock,
    // cancelled / dispatched / delivered / closed release whatever is left.
    // Closing never adds stock back; cancelling never touches what was
    // already dispatched (it only releases the reservation).
    const stockStatus = await sequelize.transaction((t) =>
      stock.syncOrder(order.id, { t, userId: req.user?.userId || null }),
    );

    // =========================================================
    // ORDER ACTIVITY LOG
    // =========================================================

    await logOrderActivity({
      orderId: order.id,
      orderNo: order.orderNo,
      action: 'ORDER_STATUS_CHANGED',

      description: `Order ${order.orderNo} status changed from ${oldStatus} → ${norm}`,

      oldValue: {
        status: oldStatus,
      },

      newValue: {
        status: norm,
      },

      performedBy: req.user?.userId || order.createdBy,

      metadata: {
        customerName: order.customer?.name || null,

        statusChange: {
          from: oldStatus,
          to: norm,
        },

        gatePassRequired: norm === 'DISPATCHED',
        gatePassAvailable: !!order.gatePassLink,

        invoiceAvailable: !!order.invoiceLink,

        receivingDocumentAvailable: !!order.receivingDocumentLink,

        productCount: order.products?.length || 0,

        dispatchCount: order.dispatches?.length || 0,

        closeRequirements:
          norm === 'CLOSED'
            ? {
                invoice: !!order.invoiceLink,
                gatePass: !!order.gatePassLink,
                receivingDocument: !!order.receivingDocumentLink,
                fullyDispatched: true,
              }
            : null,
      },

      req,
    });

    // =========================================================
    // GENERIC ACTIVITY LOG
    // =========================================================

    await logActivity({
      userId: req.user?.userId || order.createdBy,

      contextTag: 'SALES',
      subContext: 'ORDER',
      action: 'ORDER_STATUS_UPDATE',

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

        gatePassRequired: norm === 'DISPATCHED',

        invoiceAvailable: !!order.invoiceLink,

        gatePassAvailable: !!order.gatePassLink,

        receivingDocumentAvailable: !!order.receivingDocumentLink,

        productCount: order.products?.length || 0,

        dispatchCount: order.dispatches?.length || 0,
      },

      req,
    });

    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    const recipients = new Set(
      [order.createdBy, order.assignedUserId, order.secondaryUserId].filter(Boolean),
    );

    for (const uid of recipients) {
      await sendNotification({
        userId: uid,

        title: `Order Status #${order.orderNo}`,

        message: `Order #${order.orderNo} for ${order.customer?.name || 'Customer'} → ${norm}.`,
      });
    }

    await sendNotification({
      userId: ADMIN_USER_ID,

      title: `Order Status #${order.orderNo}`,

      message: `Order #${order.orderNo} changed from ${oldStatus} → ${norm}.`,
    });

    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(200).json({
      message: 'Status updated',
      order,
      stock: stockStatus,
    });
  } catch (err) {
    console.error('Update Order Status Error:', err);
    if (err instanceof stock.StockError) {
      return sendErrorResponse(res, err.status, err.message);
    }

    return sendErrorResponse(res, 500, 'Failed to update status', err.message);
  }
};
