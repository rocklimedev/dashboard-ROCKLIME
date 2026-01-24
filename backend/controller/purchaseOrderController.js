// controllers/purchaseOrderController.js

const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");
const { Product, Vendor, PurchaseOrder } = require("../models");
const PoItem = require("../models/poItem"); // Mongoose model

// Preferably move to .env
const ADMIN_USER_ID =
  process.env.ADMIN_USER_ID || "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

const PO_STATUSES = {
  PENDING: "pending",
  IN_NEGOTIATION: "in_negotiation",
  CONFIRMED: "confirmed",
  PARTIAL_DELIVERED: "partial_delivered",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const VALID_PO_STATUSES = Object.values(PO_STATUSES);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function generateDailyPONumber(t) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY");

  let attempt = 0;
  const MAX_ATTEMPTS = 20;

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
      const lastSeq = lastPO.poNumber.slice(8);
      const parsed = parseInt(lastSeq, 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    const candidate = `PO${prefix}${nextSeq}`;

    const conflict = await PurchaseOrder.findOne({
      where: { poNumber: candidate },
      transaction: t,
    });

    if (!conflict) return candidate;

    console.warn(
      `PO number collision: ${candidate} — attempt ${attempt}/${MAX_ATTEMPTS}`,
    );
  }

  throw new Error(
    `Failed to generate unique PO number after ${MAX_ATTEMPTS} attempts`,
  );
}

async function validateAndCalculateItems(items, transaction) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items must be a non-empty array");
  }

  let total = 0;
  const prepared = [];

  for (const item of items) {
    if (!item.productId) throw new Error("Every item must have productId");

    const product = await Product.findByPk(item.productId, { transaction });
    if (!product) throw new Error(`Product not found: ${item.productId}`);

    const qty = Number(item.quantity);
    if (qty <= 0 || isNaN(qty))
      throw new Error(`Invalid quantity: ${item.productId}`);

    const price = Number(item.unitPrice ?? item.mrp ?? 0);
    if (price <= 0 || isNaN(price))
      throw new Error(`Invalid unit price: ${item.productId}`);

    const lineTotal = qty * price;
    total += lineTotal;

    let imageUrl = null;
    if (product.images) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0];
      } else if (typeof product.images === "string" && product.images.trim()) {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
        } catch {}
      }
    }

    prepared.push({
      productId: item.productId,
      productName: product.name || "Unnamed",
      companyCode:
        product.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || null,
      productCode: product.product_code || product.code || "",
      imageUrl,
      quantity: qty,
      unitPrice: price,
      mrp: Number(item.mrp ?? product.mrp ?? price),
      discount: Number(item.discount ?? 0),
      discountType: item.discountType || "percent",
      tax: Number(item.tax ?? 0),
      total: lineTotal,
    });
  }

  return {
    totalAmount: Number(total.toFixed(2)),
    preparedItems: prepared,
  };
}

async function fetchPoItems(poId) {
  const doc = await PoItem.findOne({ poId }).lean().exec();
  return doc?.items || [];
}

// ─────────────────────────────────────────────────────────────
// CREATE Purchase Order
// ─────────────────────────────────────────────────────────────
exports.createPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  let mongoDoc = null;

  try {
    const { vendorId, items, expectDeliveryDate, fgsId } = req.body;
    const userId = req.user?.id || null; // ← from auth middleware

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
    if (mongoDoc?._id) {
      await PoItem.deleteOne({ _id: mongoDoc._id }).catch((e) =>
        console.error("Orphaned Mongo cleanup failed:", mongoDoc._id, e),
      );
    }
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
      ],
    });

    if (!po)
      return res.status(404).json({ message: "Purchase order not found" });

    const items = await fetchPoItems(po.id);

    return res.json({ ...po.toJSON(), items });
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
    return res.status(500).json({ message: "Error listing Purchase Orders" });
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
module.exports = exports;
