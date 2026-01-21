const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../config/database"); // MySQL connection
const { sendNotification } = require("./notificationController");
const { Product, Vendor, PurchaseOrder } = require("../models"); // Sequelize models

// Mongoose model – make sure it's imported correctly
const PoItem = require("../models/poItem"); // ← your Mongoose PoItem model

const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

// ─────────────────────────────────────────────────────────────
// Helper: Generate next daily sequential poNumber
// ─────────────────────────────────────────────────────────────
async function generateDailyPONumber(t) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY");

  let attempt = 0;
  const MAX_ATTEMPTS = 15;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    const lastPO = await PurchaseOrder.findOne({
      where: {
        poNumber: { [Op.like]: `PO${prefix}%` },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
      attributes: ["poNumber"],
      order: [["poNumber", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let nextSeq = 101;
    if (lastPO) {
      const lastSeqStr = lastPO.poNumber.slice(8);
      const parsed = parseInt(lastSeqStr, 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    const candidate = `PO${prefix}${nextSeq}`;

    const conflict = await PurchaseOrder.findOne({
      where: { poNumber: candidate },
      transaction: t,
    });

    if (!conflict) return candidate;

    console.warn(
      `PO collision: ${candidate} — retry ${attempt}/${MAX_ATTEMPTS}`,
    );
  }

  throw new Error(
    `Failed to generate unique PO number after ${MAX_ATTEMPTS} attempts`,
  );
}

// ─────────────────────────────────────────────────────────────
// Validate items & calculate total (MySQL part)
// ─────────────────────────────────────────────────────────────
async function validateAndCalculateItems(items, transaction) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array is required and cannot be empty");
  }

  let totalAmount = 0;
  const preparedItems = [];

  for (const item of items) {
    if (!item.productId) {
      throw new Error("Product ID required for every item");
    }

    const product = await Product.findByPk(item.productId, { transaction });
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const quantity = Number(item.quantity);
    if (quantity <= 0 || isNaN(quantity)) {
      throw new Error(`Invalid quantity for product ${item.productId}`);
    }

    const unitPrice = Number(item.unitPrice ?? item.mrp ?? 0);
    if (unitPrice <= 0 || isNaN(unitPrice)) {
      throw new Error(`Invalid unit price for product ${item.productId}`);
    }

    const lineTotal = quantity * unitPrice;
    totalAmount += lineTotal;

    // Inside the for loop, after finding the product

    let imageUrl = null;

    if (product.images) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0];
      } else if (
        typeof product.images === "string" &&
        product.images.trim() !== ""
      ) {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed) && parsed.length > 0) {
            imageUrl = parsed[0];
          }
        } catch (err) {
          // Invalid JSON → keep null (or log if you want visibility)
          console.warn(
            `Product ${product.productId} has invalid stringified images: ${product.images.substring(0, 100)}...`,
          );
        }
      }
    }

    preparedItems.push({
      productId: item.productId,
      productName: product.name || "Unnamed Product",
      companyCode:
        product.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || null,
      productCode: product.product_code || product.code || "",

      imageUrl, // ← now safe: real URL, null, or undefined → null

      quantity,
      unitPrice,
      mrp: item.mrp || product.mrp || unitPrice,
      discount: item.discount || 0,
      discountType: item.discountType || "percent",
      tax: item.tax || 0,
      total: lineTotal,
    });
  }

  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    preparedItems,
  };
}
// ─────────────────────────────────────────────────────────────
// Helper: Get items from MongoDB
// ─────────────────────────────────────────────────────────────
async function fetchPoItems(poId) {
  const doc = await PoItem.findOne({ poId }).lean().exec();
  return doc ? doc.items : [];
}

// ─────────────────────────────────────────────────────────────
// CREATE Purchase Order
// ─────────────────────────────────────────────────────────────
exports.createPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  let mongoDoc = null;

  try {
    const { vendorId, items, expectDeliveryDate } = req.body;

    if (!vendorId || !items || !Array.isArray(items)) {
      return res
        .status(400)
        .json({ message: "vendorId and items array are required" });
    }

    const vendor = await Vendor.findByPk(vendorId, { transaction: t });
    if (!vendor) {
      await t.rollback();
      return res.status(404).json({ message: "Vendor not found" });
    }

    const { totalAmount, preparedItems } = await validateAndCalculateItems(
      items,
      t,
    );

    const poNumber = await generateDailyPONumber(t);

    const purchaseOrder = await PurchaseOrder.create(
      {
        poNumber,
        vendorId,
        status: "pending",
        orderDate: new Date(),
        expectDeliveryDate: expectDeliveryDate
          ? new Date(expectDeliveryDate)
          : null,
        totalAmount,
      },
      { transaction: t },
    );

    // Create items in MongoDB
    mongoDoc = await PoItem.create({
      poId: purchaseOrder.id,
      poNumber: purchaseOrder.poNumber,
      vendorId: purchaseOrder.vendorId,
      items: preparedItems,
      calculatedTotal: totalAmount,
    });

    // Optional: store link back in SQL (helps debugging & cleanup)
    await purchaseOrder.update(
      { mongoItemsId: mongoDoc._id.toString() },
      { transaction: t },
    );

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New Purchase Order Created #${poNumber}`,
      message: `PO #${poNumber} for ${vendor.vendorName || "Vendor"} • ₹${totalAmount}`,
    });

    return res.status(201).json({
      message: "Purchase order created successfully",
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        items: preparedItems,
      },
    });
  } catch (error) {
    await t.rollback();

    // Manual compensation – try to clean up MongoDB doc
    if (mongoDoc) {
      await PoItem.deleteOne({ _id: mongoDoc._id }).catch((e) =>
        console.error("Cleanup failed:", e),
      );
    }

    console.error("Create PO error:", error);
    return res.status(500).json({
      message: "Error creating purchase order",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE Purchase Order
// ─────────────────────────────────────────────────────────────
exports.updatePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { vendorId, items, status, expectDeliveryDate } = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      transaction: t,
    });
    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const updateData = {};

    if (vendorId) {
      const vendorCheck = await Vendor.findByPk(vendorId, { transaction: t });
      if (!vendorCheck) throw new Error("Vendor not found");
      updateData.vendorId = vendorId;
    }

    if (status) updateData.status = status;
    if (expectDeliveryDate !== undefined) {
      updateData.expectDeliveryDate = expectDeliveryDate || null;
    }

    let newItems = null;
    let newTotal = purchaseOrder.totalAmount;

    if (items && Array.isArray(items)) {
      const { totalAmount, preparedItems } = await validateAndCalculateItems(
        items,
        t,
      );
      newTotal = totalAmount;
      updateData.totalAmount = totalAmount;

      // Replace items in MongoDB
      await PoItem.findOneAndUpdate(
        { poId: purchaseOrder.id },
        {
          vendorId: updateData.vendorId || purchaseOrder.vendorId,
          items: preparedItems,
          calculatedTotal: totalAmount,
        },
        { upsert: true, new: true },
      );

      newItems = preparedItems;
    }

    await purchaseOrder.update(updateData, { transaction: t });

    const updatedPo = await PurchaseOrder.findByPk(purchaseOrder.id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
      transaction: t,
    });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Purchase Order Updated #${purchaseOrder.poNumber}`,
      message: `PO #${purchaseOrder.poNumber} updated (${updatedPo.Vendor?.vendorName || "Vendor"}).`,
    });

    return res.status(200).json({
      message: "Purchase order updated successfully",
      purchaseOrder: {
        ...updatedPo.toJSON(),
        items: newItems || (await fetchPoItems(purchaseOrder.id)),
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({
      message: "Error updating purchase order",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────────────────────
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
    });

    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const items = await fetchPoItems(purchaseOrder.id);

    return res.status(200).json({
      ...purchaseOrder.toJSON(),
      items,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchase order",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET ALL (with pagination)
// Note: fetching items for many records can be slow → consider lazy loading in frontend
// ─────────────────────────────────────────────────────────────
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: purchaseOrders } = await PurchaseOrder.findAndCountAll(
      {
        include: [
          { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
        ],
        order: [["createdAt", "DESC"]],
        offset,
        limit,
        subQuery: false,
      },
    );

    const poIds = purchaseOrders.map((po) => po.id);
    const itemDocs = await PoItem.find({ poId: { $in: poIds } }).lean();

    const itemsByPo = new Map(
      itemDocs.map((doc) => [doc.poId, doc.items || []]),
    );

    const result = purchaseOrders.map((po) => ({
      ...po.toJSON(),
      items: itemsByPo.get(po.id) || [],
    }));

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      data: result,
      pagination: { total: count, page, limit, totalPages },
    });
  } catch (error) {
    console.error("getAllPurchaseOrders error:", error);
    return res.status(500).json({
      message: "Error fetching purchase orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
exports.deletePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      transaction: t,
    });
    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const vendor = await Vendor.findByPk(purchaseOrder.vendorId, {
      transaction: t,
    });

    await purchaseOrder.destroy({ transaction: t });

    // Clean up MongoDB
    await PoItem.deleteOne({ poId: purchaseOrder.id });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Purchase Order Deleted #${purchaseOrder.poNumber}`,
      message: `PO #${purchaseOrder.poNumber} deleted (${vendor?.vendorName || "Vendor"}).`,
    });

    return res
      .status(200)
      .json({ message: "Purchase order deleted successfully" });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error deleting purchase order",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// CONFIRM (update stock from MongoDB items)
// ─────────────────────────────────────────────────────────────
exports.confirmPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const purchaseOrder = await PurchaseOrder.findByPk(req.params.id, {
      transaction: t,
    });

    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }

    if (purchaseOrder.status !== "pending") {
      await t.rollback();
      return res.status(400).json({ message: "Purchase order is not pending" });
    }

    // Get items from MongoDB
    const items = await fetchPoItems(purchaseOrder.id);

    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        transaction: t,
      });
      if (product) {
        product.quantity = (product.quantity || 0) + item.quantity;
        await product.save({ transaction: t });
      }
    }

    await purchaseOrder.update({ status: "delivered" }, { transaction: t });

    const vendor = await Vendor.findByPk(purchaseOrder.vendorId, {
      transaction: t,
    });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Purchase Order Confirmed #${purchaseOrder.poNumber}`,
      message: `PO #${purchaseOrder.poNumber} confirmed & marked delivered (${vendor?.vendorName || "Vendor"}).`,
    });

    return res.status(200).json({
      message: "Purchase order confirmed and stock updated",
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        status: "delivered",
        items,
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error confirming purchase order",
      error: error.message,
    });
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

// ─────────────────────────────────────────────────────────────
// UPDATE STATUS ONLY
// ─────────────────────────────────────────────────────────────
exports.updatePurchaseOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      await t.rollback();
      return res.status(400).json({
        message: `Invalid status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    const purchaseOrder = await PurchaseOrder.findByPk(id, { transaction: t });
    if (!purchaseOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Purchase order not found" });
    }

    if (purchaseOrder.status === status) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Status already set to this value" });
    }

    if (status === "delivered" && purchaseOrder.status !== "delivered") {
      const items = await fetchPoItems(purchaseOrder.id);
      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          transaction: t,
        });
        if (product) {
          product.quantity = (product.quantity || 0) + item.quantity;
          await product.save({ transaction: t });
        }
      }
    }

    const oldStatus = purchaseOrder.status;
    await purchaseOrder.update({ status }, { transaction: t });

    const vendor = await Vendor.findByPk(purchaseOrder.vendorId, {
      transaction: t,
    });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `PO Status Updated #${purchaseOrder.poNumber}`,
      message: `PO #${purchaseOrder.poNumber} status changed from ${oldStatus} to ${status} (${vendor?.vendorName || "Vendor"}).`,
    });

    return res.status(200).json({
      message: `Status updated to '${status}'`,
      purchaseOrder: {
        ...purchaseOrder.toJSON(),
        status,
        items: await fetchPoItems(purchaseOrder.id),
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error updating status",
      error: error.message,
    });
  }
};
