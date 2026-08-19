const {
  sequelize,
  sendNotification,
  Product,
  Vendor,
  PurchaseOrder,
  User,
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
// CREATE Purchase Order
// ─────────────────────────────────────────────────────────────
exports.createPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  let mongoDoc = null;

  try {
    const { vendorId, items, expectDeliveryDate, fgsId } = req.body;
    const userId = req.user?.userId || null; // ← from auth middleware

    if (!vendorId || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "vendorId and non-empty items array required" });
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
        userId,
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

    await t.commit();
    await logActivity({
      userId: userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "CREATE_PURCHASE_ORDER",
      entityId: po.id,
      entityName: po.poNumber,
      description: `Purchase Order ${po.poNumber} created for ${vendor.vendorName}`,

      metadata: {
        poNumber: po.poNumber,
        vendorId: vendorId,
        vendorName: vendor.vendorName,
        totalAmount: totalAmount,
        itemCount: preparedItems.length,

        source: fgsId ? "FGS" : "DIRECT",
        fgsId: fgsId || null,

        mongoLinked: !!mongoDoc?._id,
        orderDate: po.orderDate,
        expectedDelivery: expectDeliveryDate || null,
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New PO Created — ${poNumber}`,
      message: `${vendor.vendorName || "Vendor"} • ₹${totalAmount} • ${fgsId ? "from FGS" : "direct"}`,
    });

    return res.status(201).json({
      message: "Purchase Order created",
      purchaseOrder: { ...po.toJSON(), items: preparedItems },
    });
  } catch (err) {
    await t.rollback();

    return res.status(500).json({
      message: "Failed to create Purchase Order",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE Purchase Order (items = full replacement)
// ─────────────────────────────────────────────────────────────
exports.updatePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { vendorId, items, status, expectDeliveryDate } = req.body;
    const { id } = req.params;

    const po = await PurchaseOrder.findByPk(id, { transaction: t });
    if (!po) throw new Error("Purchase order not found");

    if ([PO_STATUSES.DELIVERED, PO_STATUSES.CANCELLED].includes(po.status)) {
      throw new Error("Cannot modify delivered or cancelled Purchase Order");
    }

    const updateData = {};

    if (vendorId) {
      const v = await Vendor.findByPk(vendorId, { transaction: t });
      if (!v) throw new Error("Vendor not found");
      updateData.vendorId = vendorId;
    }

    if (status) {
      if (!VALID_PO_STATUSES.includes(status))
        throw new Error("Invalid status");
      updateData.status = status;
    }

    if (expectDeliveryDate !== undefined) {
      updateData.expectDeliveryDate = expectDeliveryDate
        ? new Date(expectDeliveryDate)
        : null;
    }

    let returnedItems = null;

    if (Array.isArray(items) && items.length > 0) {
      const { totalAmount, preparedItems } = await validateAndCalculateItems(
        items,
        t,
      );
      updateData.totalAmount = totalAmount;

      await PoItem.findOneAndUpdate(
        { poId: po.id },
        {
          vendorId: updateData.vendorId || po.vendorId,
          items: preparedItems,
          calculatedTotal: totalAmount,
        },
        { upsert: true },
      );

      returnedItems = preparedItems;
    }

    await po.update(updateData, { transaction: t });

    const updated = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
      transaction: t,
    });

    await t.commit();
    await logActivity({
      userId: req.user?.userId || po.userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "UPDATE_PURCHASE_ORDER",
      entityId: updated.id,
      entityName: po.poNumber,
      description: `Purchase Order ${po.poNumber} updated`,

      metadata: {
        poNumber: po.poNumber,

        // ── CHANGES ──
        changedFields: Object.keys(updateData),

        // ── STATUS IMPACT ──
        status: updateData.status || updated.status,

        // ── FINANCIAL IMPACT ──
        totalAmount: updated.totalAmount,

        // ── VENDOR CHANGE ──
        vendorId: updateData.vendorId || po.vendorId,
        vendorName: updated.vendor?.vendorName || null,

        // ── ITEM UPDATE ──
        itemsUpdated: !!items,
        itemCount: items?.length || updated.items?.length || 0,

        // ── DELIVERY ──
        expectedDelivery:
          updateData.expectDeliveryDate || po.expectDeliveryDate,
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Updated — ${po.poNumber}`,
      message: `Status: ${updated.status} • ${updated.vendor?.vendorName || "?"} • ₹${updated.totalAmount}`,
    });

    return res.json({
      message: "Purchase Order updated",
      purchaseOrder: {
        ...updated.toJSON(),
        items: returnedItems || (await fetchPoItems(id)),
      },
    });
  } catch (err) {
    await t.rollback();
    const code = err.message.includes("not found") ? 404 : 400;
    return res
      .status(code)
      .json({ message: "Update failed", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
        {
          model: User,
          as: "createdBy", // ← change from "creator" to "createdBy"
          attributes: ["userId", "name", "email", "username"],
        },
      ],
    });

    if (!po)
      return res.status(404).json({ message: "Purchase order not found" });

    const items = await fetchPoItems(po.id);

    return res.json({
      ...po.toJSON(),
      items,
      createdBy: po.createdBy
        ? {
            userId: po.createdBy.userId,
            name: po.createdBy.name,
            email: po.createdBy.email,
            username: po.createdBy.username,
          }
        : null,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching PO", error: err.message });
  }
};
// ─────────────────────────────────────────────────────────────
// GET ALL (paginated)
// ─────────────────────────────────────────────────────────────
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
        {
          model: User,
          as: "createdBy", // ← add this
          attributes: ["userId", "name", "email", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      subQuery: false,
    });

    const poIds = rows.map((r) => r.id);
    const mongoDocs = await PoItem.find({ poId: { $in: poIds } }).lean();

    const itemsMap = new Map(mongoDocs.map((d) => [d.poId, d.items || []]));

    const result = rows.map((po) => ({
      ...po.toJSON(),
      items: itemsMap.get(po.id) || [],
      createdBy: po.createdBy
        ? {
            userId: po.createdBy.userId,
            name: po.createdBy.name,
            email: po.createdBy.email,
            username: po.createdBy.username,
          }
        : null,
    }));

    return res.json({
      data: result,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error listing Purchase Orders",
      error: err.message, // ← send it to frontend during dev
      // remove this line in production
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
exports.deletePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: Vendor, as: "vendor" }],
      transaction: t,
    });

    if (!po) throw new Error("Not found");

    await po.destroy({ transaction: t });
    await PoItem.deleteOne({ poId: po.id });
    await logActivity({
      userId: req.user?.userId || po.userId,
      contextTag: "PROCUREMENT",
      subContext: "PURCHASE_ORDER",
      action: "DELETE_PURCHASE_ORDER",
      entityId: po.id,
      entityName: po.poNumber,
      description: `Purchase Order ${po.poNumber} deleted`,

      oldValues: {
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: po.vendor?.vendorName || null,
        totalAmount: po.totalAmount,
        status: po.status,
      },

      metadata: {
        vendorName: po.vendor?.vendorName || null,
        totalAmount: po.totalAmount,
        hasMongoItems: true,
        mongoDeleted: false, // we delete after commit logic-wise
        itemCount: null,
        warning: "PO permanently deleted",

        deletionType: "HARD_DELETE",
      },

      req,
    });
    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Deleted — ${po.poNumber}`,
      message: `${po.vendor?.vendorName || "Vendor"} • ${po.totalAmount}`,
    });

    return res.json({ message: "Purchase Order deleted successfully" });
  } catch (err) {
    await t.rollback();
    const code = err.message.includes("not found") ? 404 : 500;
    return res
      .status(code)
      .json({ message: "Delete failed", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET BY VENDOR
// ─────────────────────────────────────────────────────────────
exports.getPurchaseOrdersByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const purchaseOrders = await PurchaseOrder.findAll({
      where: { vendorId },
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const poIds = purchaseOrders.map((po) => po.id);
    const itemDocs = await PoItem.find({ poId: { $in: poIds } }).lean();

    const itemsMap = new Map(itemDocs.map((d) => [d.poId, d.items || []]));

    const result = purchaseOrders.map((po) => ({
      ...po.toJSON(),
      items: itemsMap.get(po.id) || [],
    }));

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchase orders by vendor",
      error: error.message,
    });
  }
};
