const {
  sequelize,
  sendNotification,
  Product,
  Vendor,
  PurchaseOrder,
  PoItem,
  logActivity,
  ADMIN_USER_ID,
  PO_STATUSES,
  VALID_PO_STATUSES,
  generateDailyPONumber,
  validateAndCalculateItems,
  fetchPoItems,
} = require("./purchase-order.helpers");

// ─────────────────────────────────────────────────────────────
// CONFIRM & UPDATE STOCK
// ─────────────────────────────────────────────────────────────
exports.confirmPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const po = await PurchaseOrder.findByPk(req.params.id, { transaction: t });
    if (!po) throw new Error("Purchase order not found");

    if (
      po.status !== PO_STATUSES.PENDING &&
      po.status !== PO_STATUSES.CONFIRMED
    ) {
      throw new Error("Can only confirm pending or confirmed orders");
    }

    const items = await fetchPoItems(po.id);
    if (items.length === 0) throw new Error("No items in PO");

    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        transaction: t,
      });
      if (product) {
        product.quantity = Number(product.quantity || 0) + item.quantity;
        await product.save({ transaction: t });
      }
    }

    await po.update({ status: PO_STATUSES.DELIVERED }, { transaction: t });

    const vendor = await Vendor.findByPk(po.vendorId, { transaction: t });

    await t.commit();
    await logActivity({
      userId: req.user?.userId || po.userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "CONFIRM_PURCHASE_ORDER",
      entityId: po.id,
      entityName: po.poNumber,
      description: `Purchase Order ${po.poNumber} confirmed and marked as delivered`,

      oldValues: {
        status: po.status,
      },

      newValues: {
        status: PO_STATUSES.DELIVERED,
      },

      metadata: {
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: vendor?.vendorName || null,

        totalAmount: po.totalAmount,

        itemCount: items.length,

        stockUpdated: true,

        stockImpact: items.map((i) => ({
          productId: i.productId,
          quantityAdded: i.quantity,
        })),

        deliveryType: "PO_CONFIRMATION",
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Confirmed & Delivered — ${po.poNumber}`,
      message: `${vendor?.vendorName || "?"} • ₹${po.totalAmount}`,
    });

    return res.json({
      message: "Purchase Order confirmed and stock updated",
      purchaseOrder: { ...po.toJSON(), status: PO_STATUSES.DELIVERED },
    });
  } catch (err) {
    await t.rollback();
    return res
      .status(400)
      .json({ message: "Confirmation failed", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE STATUS ONLY
// ─────────────────────────────────────────────────────────────
exports.updatePurchaseOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !VALID_PO_STATUSES.includes(status)) {
      throw new Error(
        `Invalid status. Allowed: ${VALID_PO_STATUSES.join(", ")}`,
      );
    }

    const po = await PurchaseOrder.findByPk(id, { transaction: t });
    if (!po) throw new Error("Purchase order not found");

    if (po.status === status) throw new Error("Status already set");

    // Auto-update stock when moving to delivered
    if (
      status === PO_STATUSES.DELIVERED &&
      po.status !== PO_STATUSES.DELIVERED
    ) {
      const items = await fetchPoItems(po.id);
      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          transaction: t,
        });
        if (product) {
          product.quantity = Number(product.quantity || 0) + item.quantity;
          await product.save({ transaction: t });
        }
      }
    }

    const oldStatus = po.status;
    await po.update({ status }, { transaction: t });

    const vendor = await Vendor.findByPk(po.vendorId, { transaction: t });

    await t.commit();
    await logActivity({
      userId: req.user?.userId || po.userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "UPDATE_PO_STATUS",
      entityId: po.id,
      entityName: po.poNumber,
      description: `PO ${po.poNumber} status changed from ${oldStatus} to ${status}`,

      oldValues: {
        status: oldStatus,
      },

      newValues: {
        status,
      },

      metadata: {
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: vendor?.vendorName || null,

        stockUpdated:
          status === PO_STATUSES.DELIVERED &&
          oldStatus !== PO_STATUSES.DELIVERED,

        stockImpact:
          status === PO_STATUSES.DELIVERED &&
          oldStatus !== PO_STATUSES.DELIVERED
            ? "INCREMENTED_FROM_PO_ITEMS"
            : null,

        transitionType: `${oldStatus}_TO_${status}`,
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Status Changed — ${po.poNumber}`,
      message: `${oldStatus} → ${status} • ${vendor?.vendorName || "?"}`,
    });

    return res.json({
      message: `Status updated to ${status}`,
      purchaseOrder: { ...po.toJSON(), status },
    });
  } catch (err) {
    await t.rollback();
    return res
      .status(400)
      .json({ message: "Status update failed", error: err.message });
  }
};

// Utility to create PO from data (used by FGS conversion + maybe others)
exports.createPurchaseOrderFromData = async (data, transaction = null) => {
  const t = transaction || (await sequelize.transaction());
  let mongoDoc = null;
  let shouldCommit = !transaction;

  try {
    const { vendorId, items, expectDeliveryDate, fgsId, createdBy } = data;

    if (!vendorId || !Array.isArray(items) || items.length === 0) {
      throw new Error("vendorId and non-empty items array required");
    }

    const vendor = await Vendor.findByPk(vendorId, { transaction: t });
    if (!vendor) throw new Error("Vendor not found");

    const { totalAmount, preparedItems } = await validateAndCalculateItems(
      items,
      t,
    );

    const poNumber = await generateDailyPONumber(t);

    const po = await PurchaseOrder.create(
      {
        poNumber,
        vendorId,
        userId: createdBy || null,
        fgsId: fgsId || null,
        status: PO_STATUSES.PENDING,
        orderDate: new Date(),
        expectDeliveryDate: expectDeliveryDate
          ? new Date(expectDeliveryDate)
          : null,
        totalAmount,
      },
      { transaction: t },
    );

    // Fixed: no second argument / no fake session
    mongoDoc = await PoItem.create({
      poId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      items: preparedItems,
      calculatedTotal: totalAmount,
    });

    await po.update(
      { mongoItemsId: mongoDoc._id.toString() },
      { transaction: t },
    );

    if (shouldCommit) {
      await t.commit();

      await logActivity({
        userId: createdBy || null,
        contextTag: "PROCUREMENT",
        subContext: "PURCHASE_ORDER",
        action: "CREATE_PO_FROM_SERVICE",
        entityId: po.id,
        entityName: po.poNumber,
        description: `Purchase Order ${po.poNumber} created via service layer`,

        metadata: {
          poNumber: po.poNumber,
          vendorId,
          vendorName: vendor.vendorName || null,

          totalAmount,
          itemCount: preparedItems.length,

          source: fgsId ? "FGS" : "DIRECT",
          fgsId: fgsId || null,

          mongoLinked: !!mongoDoc?._id,
          serviceLayer: true,
        },
      });
    }
    return {
      purchaseOrder: { ...po.toJSON(), items: preparedItems },
      poNumber: po.poNumber,
    };
  } catch (err) {
    if (shouldCommit) await t.rollback();

    if (mongoDoc?._id) {
      await PoItem.deleteOne({ _id: mongoDoc._id }).catch(console.error);
    }

    throw err;
  }
};
