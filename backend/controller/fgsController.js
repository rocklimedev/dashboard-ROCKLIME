// controllers/fieldGuidedSheetController.js

const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");
const { Product, Vendor, FieldGuidedSheet, User } = require("../models");
const FgsItem = require("../models/fgsItem"); // Mongoose model
const { createPurchaseOrderFromData } = require("./purchaseOrderController"); // ← Assume this exists or create it
const { ActivityLog } = require("../models");
const logActivity = require("../utils/activityLogger");
// Move to env or config in production
const ADMIN_USER_ID =
  process.env.ADMIN_USER_ID || "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

const FGS_STATUSES = {
  DRAFT: "draft",
  NEGOTIATING: "negotiating",
  APPROVED: "approved",
  CONVERTED: "converted",
  CANCELLED: "cancelled",
};

const VALID_FGS_STATUSES = Object.values(FGS_STATUSES);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function generateDailyFGSNumber(t) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY");

  let attempt = 0;
  const MAX_ATTEMPTS = 20;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    const lastFGS = await FieldGuidedSheet.findOne({
      where: {
        fgsNumber: { [Op.like]: `FGS${prefix}%` },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
      attributes: ["fgsNumber"],
      order: [["fgsNumber", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let nextSeq = 101;
    if (lastFGS) {
      const lastSeq = lastFGS.fgsNumber.slice(9);
      const parsed = parseInt(lastSeq, 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    const candidate = `FGS${prefix}${nextSeq}`;

    const conflict = await FieldGuidedSheet.findOne({
      where: { fgsNumber: candidate },
      transaction: t,
    });

    if (!conflict) return candidate;
  }

  throw new Error(
    `Failed to generate unique FGS number after ${MAX_ATTEMPTS} attempts`,
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
        } catch {
          // silent fail
        }
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

async function fetchFgsItems(fgsId) {
  const doc = await FgsItem.findOne({ fgsId }).lean().exec();
  return doc?.items || [];
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────
exports.createFieldGuidedSheet = async (req, res) => {
  const t = await sequelize.transaction();
  let mongoDoc = null;

  try {
    const { vendorId, items, expectDeliveryDate } = req.body;
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

    const fgsNumber = await generateDailyFGSNumber(t);

    const fgs = await FieldGuidedSheet.create(
      {
        fgsNumber,
        vendorId,
        userId,
        status: FGS_STATUSES.DRAFT,
        orderDate: new Date(),
        expectDeliveryDate: expectDeliveryDate
          ? new Date(expectDeliveryDate)
          : null,
        totalAmount,
      },
      { transaction: t },
    );

    mongoDoc = await FgsItem.create({
      fgsId: fgs.id,
      fgsNumber: fgs.fgsNumber,
      vendorId: fgs.vendorId,
      items: preparedItems,
      calculatedTotal: totalAmount,
    });

    await fgs.update(
      { mongoItemsId: mongoDoc._id.toString() },
      { transaction: t },
    );

    await t.commit();

    await logActivity({
      userId: req.user?.userId,

      contextTag: "PROCUREMENT",
      subContext: "FIELD_GUIDED_SHEET",

      action: "FGS_CREATED",

      entityId: fgs.id,
      entityName: fgs.fgsNumber,

      description: `Field Guided Sheet ${fgs.fgsNumber} created for ${vendor.vendorName}`,

      newValues: {
        fgsId: fgs.id,
        fgsNumber: fgs.fgsNumber,
        vendorId: vendor.id,
        vendorName: vendor.vendorName,
        totalAmount,
        status: fgs.status,
        itemCount: preparedItems.length,
      },

      metadata: {
        mongoItemsId: mongoDoc?._id?.toString(),
      },

      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New FGS Created — ${fgsNumber}`,
      message: `${vendor.vendorName || "Vendor"} • ₹${totalAmount} • Created by ${req.user?.name || "user"}`,
    });

    return res.status(201).json({
      message: "Field Guided Sheet created",
      fieldGuidedSheet: { ...fgs.toJSON(), items: preparedItems },
    });
  } catch (err) {
    await t.rollback();

    if (mongoDoc?._id) {
      await FgsItem.deleteOne({ _id: mongoDoc._id }).catch((e) =>
        console.error("Orphaned Mongo cleanup failed:", mongoDoc._id, e),
      );
    }

    return res.status(500).json({
      message: "Failed to create Field Guided Sheet",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE (items = full replacement)
// ─────────────────────────────────────────────────────────────
exports.updateFieldGuidedSheet = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { vendorId, items, status, expectDeliveryDate } = req.body;
    const { id } = req.params;

    const fgs = await FieldGuidedSheet.findByPk(id, { transaction: t });
    if (!fgs) throw new Error("Field guided sheet not found");

    if (fgs.status === FGS_STATUSES.CONVERTED) {
      throw new Error("Cannot modify converted Field Guided Sheet");
    }

    const updateData = {};

    if (vendorId) {
      const v = await Vendor.findByPk(vendorId, { transaction: t });
      if (!v) throw new Error("Vendor not found");
      updateData.vendorId = vendorId;
    }

    if (status) {
      if (!VALID_FGS_STATUSES.includes(status))
        throw new Error("Invalid status");
      if (status === FGS_STATUSES.CONVERTED) {
        throw new Error("Use /convert endpoint to convert to PO");
      }
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

      await FgsItem.findOneAndUpdate(
        { fgsId: fgs.id },
        {
          vendorId: updateData.vendorId || fgs.vendorId,
          items: preparedItems,
          calculatedTotal: totalAmount,
        },
        { upsert: true, new: true },
      );

      returnedItems = preparedItems;
    }

    await fgs.update(updateData, { transaction: t });

    const updated = await FieldGuidedSheet.findByPk(id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
      transaction: t,
    });

    await t.commit();
    // -------------------------------
    // 🔥 ACTIVITY LOG (after commit)
    // -------------------------------
    await logActivity({
      userId: req.user?.userId || null,
      contextTag: "PROCUREMENT",
      subContext: "FIELD_GUIDED_SHEET",
      action: "UPDATE",
      entityId: updated.id,
      entityName: updated.fgsNumber,
      description: `FGS updated: ${updated.fgsNumber}`,
      oldValues: oldSnapshot,
      newValues: updated.toJSON(),
      metadata: {
        updatedFields: Object.keys(updateData),
        itemUpdated: !!returnedItems,
      },
      req,
    });
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `FGS Updated — ${fgs.fgsNumber}`,
      message: `Status: ${updated.status} • ${updated.vendor?.vendorName || "?"} • ₹${updated.totalAmount}`,
    });

    return res.json({
      message: "Field Guided Sheet updated",
      fieldGuidedSheet: {
        ...updated.toJSON(),
        items: returnedItems || (await fetchFgsItems(id)),
      },
    });
  } catch (err) {
    await t.rollback();
    const statusCode = err.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      message: "Update failed",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────
exports.getFieldGuidedSheetById = async (req, res) => {
  try {
    const fgs = await FieldGuidedSheet.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
        {
          model: User,
          as: "createdBy",
          attributes: ["userId", "name", "email", "username"],
        },
      ],
    });

    if (!fgs) {
      return res.status(404).json({ message: "Field guided sheet not found" });
    }

    const items = await fetchFgsItems(fgs.id);

    // Optional: make createdBy shape consistent with PO
    const createdBy = fgs.createdBy
      ? {
          userId: fgs.createdBy.userId,
          name: fgs.createdBy.name,
          email: fgs.createdBy.email,
          username: fgs.createdBy.username,
        }
      : null;

    return res.json({
      ...fgs.toJSON(),
      items,
      createdBy, // ← add this explicitly if you want same shape as PO
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching FGS", error: err.message });
  }
};
// ─────────────────────────────────────────────────────────────
// GET ALL (with basic pagination)
// ─────────────────────────────────────────────────────────────
exports.getAllFieldGuidedSheets = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await FieldGuidedSheet.findAndCountAll({
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
        {
          model: User,
          as: "createdBy",
          attributes: ["userId", "name", "email", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      subQuery: false,
    });

    const fgsIds = rows.map((r) => r.id);
    const mongoDocs = await FgsItem.find({ fgsId: { $in: fgsIds } }).lean();

    const itemsMap = new Map(mongoDocs.map((d) => [d.fgsId, d.items || []]));

    const result = rows.map((fgs) => {
      const createdBy = fgs.createdBy
        ? {
            userId: fgs.createdBy.userId,
            name: fgs.createdBy.name,
            email: fgs.createdBy.email,
            username: fgs.createdBy.username,
          }
        : null;

      return {
        ...fgs.toJSON(),
        items: itemsMap.get(fgs.id) || [],
        createdBy, // ← consistent shape
      };
    });

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
    return res
      .status(500)
      .json({ message: "Error listing Field Guided Sheets" });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
exports.deleteFieldGuidedSheet = async (req, res) => {
  const t = await sequelize.transaction();

  let fgs;
  let snapshot;

  try {
    fgs = await FieldGuidedSheet.findByPk(req.params.id, {
      include: [{ model: Vendor, as: "vendor" }],
      transaction: t,
    });

    if (!fgs) throw new Error("Not found");

    // snapshot BEFORE delete
    snapshot = {
      id: fgs.id,
      fgsNumber: fgs.fgsNumber,
      vendorId: fgs.vendorId,
      totalAmount: fgs.totalAmount,
    };

    await fgs.destroy({ transaction: t });

    await t.commit();
  } catch (err) {
    try {
      await t.rollback();
    } catch (rbErr) {
      console.error("Rollback failed:", rbErr.message);
    }

    const code = err.message.toLowerCase().includes("not found") ? 404 : 500;

    return res.status(code).json({
      message: "Delete failed",
      error: err.message,
    });
  }

  // ✅ OUTSIDE transaction (safe zone)
  try {
    await FgsItem.deleteOne({ fgsId: snapshot.id });

    await logActivity({
      userId: req.user?.userId || null,
      contextTag: "PROCUREMENT",
      subContext: "FIELD_GUIDED_SHEET",
      action: "DELETE",
      entityId: snapshot.id,
      entityName: snapshot.fgsNumber,
      description: `FGS deleted: ${snapshot.fgsNumber}`,
      oldValues: snapshot,
      newValues: null,
      metadata: {
        vendorId: snapshot.vendorId,
        totalAmount: snapshot.totalAmount,
      },
      req,
    });

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `FGS Deleted — ${snapshot.fgsNumber}`,
      message: `${fgs?.vendor?.vendorName || "Vendor"} • ${snapshot.totalAmount}`,
    });
  } catch (sideErr) {
    console.error("Post-delete side effect failed:", sideErr.message);
  }

  return res.json({
    message: "Field Guided Sheet deleted successfully",
  });
};
// ─────────────────────────────────────────────────────────────
// CONVERT TO PURCHASE ORDER
// ─────────────────────────────────────────────────────────────
exports.convertFgsToPo = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const fgs = await FieldGuidedSheet.findByPk(req.params.id, {
      include: [{ model: Vendor, as: "vendor" }],
      transaction: t,
    });

    if (!fgs) throw new Error("Field guided sheet not found");
    if (fgs.status !== FGS_STATUSES.APPROVED) {
      throw new Error("Only approved FGS can be converted to PO");
    }

    const items = await fetchFgsItems(fgs.id);
    if (items.length === 0) throw new Error("No items found in FGS");

    // Prepare data for PO creation (assume createPurchaseOrderFromData exists)
    const poData = {
      vendorId: fgs.vendorId,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        mrp: i.mrp,
        discount: i.discount,
        discountType: i.discountType,
        tax: i.tax,
      })),
      expectDeliveryDate: fgs.expectDeliveryDate,
      fgsId: fgs.id,
      createdBy: req.user?.id,
    };

    const poResult = await createPurchaseOrderFromData(poData, t);

    if (!poResult?.purchaseOrder) {
      throw new Error("Failed to create Purchase Order");
    }

    await fgs.update({ status: FGS_STATUSES.CONVERTED }, { transaction: t });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `FGS → PO  ${fgs.fgsNumber} → ${poResult.purchaseOrder.poNumber}`,
      message: `Converted • ${fgs.vendor?.vendorName || "?"} • ₹${fgs.totalAmount}`,
    });

    return res.json({
      message: "Successfully converted to Purchase Order",
      purchaseOrder: poResult.purchaseOrder,
    });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({
      message: "Conversion failed",
      error: err.message,
    });
  }
};

exports.updateFieldGuidedSheetStatus = async (req, res) => {
  const t = await sequelize.transaction();

  let oldStatus;
  let fgs;
  let vendor;

  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !VALID_FGS_STATUSES.includes(status)) {
      throw new Error(
        `Invalid status. Allowed: ${VALID_FGS_STATUSES.join(", ")}`,
      );
    }

    fgs = await FieldGuidedSheet.findByPk(id, { transaction: t });
    if (!fgs) throw new Error("Not found");

    oldStatus = fgs.status;

    if (oldStatus === status) {
      throw new Error("Status is already set to this value");
    }

    if (status === FGS_STATUSES.CONVERTED) {
      throw new Error("Use /convert endpoint to convert to PO");
    }

    await fgs.update({ status }, { transaction: t });

    vendor = await Vendor.findByPk(fgs.vendorId, { transaction: t });

    // ✅ commit ONLY DB work
    await t.commit();
  } catch (err) {
    try {
      await t.rollback();
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr.message);
    }

    return res.status(400).json({
      message: "Status update failed",
      error: err.message,
    });
  }

  // ✅ OUTSIDE transaction: safe side-effects
  try {
    await logActivity({
      userId: req.user?.userId || null,
      contextTag: "PROCUREMENT",
      subContext: "FIELD_GUIDED_SHEET",
      action: "STATUS_UPDATE",
      entityId: fgs.id,
      entityName: fgs.fgsNumber,
      description: `FGS status changed: ${oldStatus} → ${fgs.status}`,
      oldValues: { status: oldStatus },
      newValues: { status: fgs.status },
      metadata: {
        vendorId: fgs.vendorId,
        vendorName: vendor?.vendorName || null,
      },
      req,
    });

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `FGS Status Changed — ${fgs.fgsNumber}`,
      message: `${oldStatus} → ${fgs.status} • ${vendor?.vendorName || "?"}`,
    });
  } catch (sideErr) {
    console.error("Post-commit side effect failed:", sideErr.message);
  }

  return res.json({
    message: `Status updated to ${fgs.status}`,
    fieldGuidedSheet: fgs.toJSON(),
  });
};

module.exports = exports;
