const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");
const { Product, Vendor, FieldGuidedSheet } = require("../models");
const FgsItem = require("../models/fgsItem"); // NEW Mongoose model
const { createPurchaseOrder } = require("./purchaseOrderController"); // Import for conversion
const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";

// ─────────────────────────────────────────────────────────────
// Helper: Generate next daily sequential fgsNumber
// ─────────────────────────────────────────────────────────────
async function generateDailyFGSNumber(t) {
  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();
  const prefix = moment().format("DDMMYY");

  let attempt = 0;
  const MAX_ATTEMPTS = 15;

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
      const lastSeqStr = lastFGS.fgsNumber.slice(9);
      const parsed = parseInt(lastSeqStr, 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    const candidate = `FGS${prefix}${nextSeq}`;

    const conflict = await FieldGuidedSheet.findOne({
      where: { fgsNumber: candidate },
      transaction: t,
    });

    if (!conflict) return candidate;

    console.warn(
      `FGS collision: ${candidate} — retry ${attempt}/${MAX_ATTEMPTS}`,
    );
  }

  throw new Error(
    `Failed to generate unique FGS number after ${MAX_ATTEMPTS} attempts`,
  );
}
// ─────────────────────────────────────────────────────────────
// Validate items & calculate total (updated for reactivity: allow partial items update)
// ─────────────────────────────────────────────────────────────
async function validateAndCalculateItems(items, transaction, isPartial = false) {
  if (!Array.isArray(items) || (!isPartial && items.length === 0)) {
    throw new Error("Items array is required and cannot be empty unless partial update");
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
      imageUrl,
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
// Validate items & calculate total (reuse from PO, or duplicate if needed)
// For simplicity, assume same validateAndCalculateItems as in PO
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Helper: Get items from MongoDB for FGS
// ─────────────────────────────────────────────────────────────
async function fetchFgsItems(fgsId) {
  const doc = await FgsItem.findOne({ fgsId }).lean().exec();
  return doc ? doc.items : [];
}

// ─────────────────────────────────────────────────────────────
// CREATE Field Guided Sheet
// ─────────────────────────────────────────────────────────────
exports.createFieldGuidedSheet = async (req, res) => {
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

    const fgsNumber = await generateDailyFGSNumber(t);

    const fieldGuidedSheet = await FieldGuidedSheet.create(
      {
        fgsNumber,
        vendorId,
        status: "draft",
        orderDate: new Date(),
        expectDeliveryDate: expectDeliveryDate
          ? new Date(expectDeliveryDate)
          : null,
        totalAmount,
      },
      { transaction: t },
    );

    // Create items in MongoDB
    mongoDoc = await FgsItem.create({
      fgsId: fieldGuidedSheet.id,
      fgsNumber: fieldGuidedSheet.fgsNumber,
      vendorId: fieldGuidedSheet.vendorId,
      items: preparedItems,
      calculatedTotal: totalAmount,
    });

    await fieldGuidedSheet.update(
      { mongoItemsId: mongoDoc._id.toString() },
      { transaction: t },
    );

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `New Field Guided Sheet Created #${fgsNumber}`,
      message: `FGS #${fgsNumber} for ${vendor.vendorName || "Vendor"} • ₹${totalAmount}`,
    });

    return res.status(201).json({
      message: "Field guided sheet created successfully",
      fieldGuidedSheet: {
        ...fieldGuidedSheet.toJSON(),
        items: preparedItems,
      },
    });
  } catch (error) {
    await t.rollback();

    if (mongoDoc) {
      await FgsItem.deleteOne({ _id: mongoDoc._id }).catch((e) =>
        console.error("Cleanup failed:", e),
      );
    }

    console.error("Create FGS error:", error);
    return res.status(500).json({
      message: "Error creating field guided sheet",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE Field Guided Sheet (supports reactive changes, e.g., during negotiation)
// ─────────────────────────────────────────────────────────────
exports.updateFieldGuidedSheet = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { vendorId, items, status, expectDeliveryDate } = req.body;

    const fieldGuidedSheet = await FieldGuidedSheet.findByPk(req.params.id, {
      transaction: t,
    });
    if (!fieldGuidedSheet) {
      await t.rollback();
      return res.status(404).json({ message: "Field guided sheet not found" });
    }

    if (fieldGuidedSheet.status === "converted") {
      await t.rollback();
      return res.status(400).json({ message: "Cannot update converted FGS" });
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
    let newTotal = fieldGuidedSheet.totalAmount;

    if (items && Array.isArray(items)) {
      const { totalAmount, preparedItems } = await validateAndCalculateItems(
        items,
        t,
        true  // Allow partial
      );
      newTotal = totalAmount;
      updateData.totalAmount = totalAmount;

      const existingDoc = await FgsItem.findOne({ fgsId: fieldGuidedSheet.id });
      const existingItems = existingDoc ? existingDoc.items : [];
      const itemMap = new Map(existingItems.map(i => [i.productId, i]));
      preparedItems.forEach(newItem => itemMap.set(newItem.productId, newItem));
      const mergedItems = Array.from(itemMap.values());

      await FgsItem.findOneAndUpdate(
        { fgsId: fieldGuidedSheet.id },
        {
          vendorId: updateData.vendorId || fieldGuidedSheet.vendorId,
          items: mergedItems,
          calculatedTotal: newTotal,
        },
        { upsert: true, new: true },
      );

      newItems = mergedItems;
    }

    await fieldGuidedSheet.update(updateData, { transaction: t });

    const updatedFgs = await FieldGuidedSheet.findByPk(fieldGuidedSheet.id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
      transaction: t,
    });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Field Guided Sheet Updated #${fieldGuidedSheet.fgsNumber}`,
      message: `FGS #${fieldGuidedSheet.fgsNumber} updated (${updatedFgs.vendor?.vendorName || "Vendor"}).`,
    });

    return res.status(200).json({
      message: "Field guided sheet updated successfully",
      fieldGuidedSheet: {
        ...updatedFgs.toJSON(),
        items: newItems || (await fetchFgsItems(fieldGuidedSheet.id)),
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({
      message: "Error updating field guided sheet",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET BY ID for FGS
// ─────────────────────────────────────────────────────────────
exports.getFieldGuidedSheetById = async (req, res) => {
  try {
    const fieldGuidedSheet = await FieldGuidedSheet.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: "vendor", attributes: ["id", "vendorName"] },
      ],
    });

    if (!fieldGuidedSheet) {
      return res.status(404).json({ message: "Field guided sheet not found" });
    }

    const items = await fetchFgsItems(fieldGuidedSheet.id);

    return res.status(200).json({
      ...fieldGuidedSheet.toJSON(),
      items,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching field guided sheet",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET ALL for FGS (with pagination)
// ─────────────────────────────────────────────────────────────
exports.getAllFieldGuidedSheets = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: fieldGuidedSheets } = await FieldGuidedSheet.findAndCountAll(
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

    const fgsIds = fieldGuidedSheets.map((fgs) => fgs.id);
    const itemDocs = await FgsItem.find({ fgsId: { $in: fgsIds } }).lean();

    const itemsByFgs = new Map(
      itemDocs.map((doc) => [doc.fgsId, doc.items || []]),
    );

    const result = fieldGuidedSheets.map((fgs) => ({
      ...fgs.toJSON(),
      items: itemsByFgs.get(fgs.id) || [],
    }));

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      data: result,
      pagination: { total: count, page, limit, totalPages },
    });
  } catch (error) {
    console.error("getAllFieldGuidedSheets error:", error);
    return res.status(500).json({
      message: "Error fetching field guided sheets",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE for FGS
// ─────────────────────────────────────────────────────────────
exports.deleteFieldGuidedSheet = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const fieldGuidedSheet = await FieldGuidedSheet.findByPk(req.params.id, {
      transaction: t,
    });
    if (!fieldGuidedSheet) {
      await t.rollback();
      return res.status(404).json({ message: "Field guided sheet not found" });
    }

    const vendor = await Vendor.findByPk(fieldGuidedSheet.vendorId, {
      transaction: t,
    });

    await fieldGuidedSheet.destroy({ transaction: t });

    // Clean up MongoDB
    await FgsItem.deleteOne({ fgsId: fieldGuidedSheet.id });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `Field Guided Sheet Deleted #${fieldGuidedSheet.fgsNumber}`,
      message: `FGS #${fieldGuidedSheet.fgsNumber} deleted (${vendor?.vendorName || "Vendor"}).`,
    });

    return res
      .status(200)
      .json({ message: "Field guided sheet deleted successfully" });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error deleting field guided sheet",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// CONVERT FGS to PO (key feature)
// Only if status is "approved"
// Creates a new PO using FGS data
// ─────────────────────────────────────────────────────────────
exports.convertFgsToPo = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const fieldGuidedSheet = await FieldGuidedSheet.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: "vendor" },
      ],
      transaction: t,
    });

    if (!fieldGuidedSheet) {
      await t.rollback();
      return res.status(404).json({ message: "Field guided sheet not found" });
    }

    if (fieldGuidedSheet.status !== "approved") {
      await t.rollback();
      return res.status(400).json({ message: "FGS must be approved to convert" });
    }

    const items = await fetchFgsItems(fieldGuidedSheet.id);
    if (items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "No items in FGS" });
    }

    // Prepare data for PO creation
    const poData = {
      vendorId: fieldGuidedSheet.vendorId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        mrp: item.mrp,
        discount: item.discount,
        discountType: item.discountType,
        tax: item.tax,
      })),
      expectDeliveryDate: fieldGuidedSheet.expectDeliveryDate,
      fgsId: fieldGuidedSheet.id,  // Link back
    };

    // Simulate req.body for createPurchaseOrder (or call internally)
    const mockReq = { body: poData };
    const mockRes = {
      status: (code) => ({
        json: (data) => data,
      }),
    };

    const poResult = await createPurchaseOrder(mockReq, mockRes);

    if (!poResult || !poResult.purchaseOrder) {
      throw new Error("Failed to create PO from FGS");
    }

    // Update FGS status
    await fieldGuidedSheet.update({ status: "converted" }, { transaction: t });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `FGS Converted to PO #${fieldGuidedSheet.fgsNumber}`,
      message: `FGS #${fieldGuidedSheet.fgsNumber} converted to PO #${poResult.purchaseOrder.poNumber} (${fieldGuidedSheet.vendor?.vendorName || "Vendor"}).`,
    });

    return res.status(200).json({
      message: "FGS converted to PO successfully",
      purchaseOrder: poResult.purchaseOrder,
    });
  } catch (error) {
    await t.rollback();
    console.error("Convert FGS to PO error:", error);
    return res.status(500).json({
      message: "Error converting FGS to PO",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE STATUS ONLY for FGS
// ─────────────────────────────────────────────────────────────
exports.updateFieldGuidedSheetStatus = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["draft", "negotiating", "approved", "converted", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      await t.rollback();
      return res.status(400).json({
        message: `Invalid status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    const fieldGuidedSheet = await FieldGuidedSheet.findByPk(id, { transaction: t });
    if (!fieldGuidedSheet) {
      await t.rollback();
      return res.status(404).json({ message: "Field guided sheet not found" });
    }

    if (fieldGuidedSheet.status === status) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Status already set to this value" });
    }

    if (status === "converted") {
      await t.rollback();
      return res.status(400).json({ message: "Use convert endpoint for conversion" });
    }

    const oldStatus = fieldGuidedSheet.status;
    await fieldGuidedSheet.update({ status }, { transaction: t });

    const vendor = await Vendor.findByPk(fieldGuidedSheet.vendorId, {
      transaction: t,
    });

    await t.commit();

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: `FGS Status Updated #${fieldGuidedSheet.fgsNumber}`,
      message: `FGS #${fieldGuidedSheet.fgsNumber} status changed from ${oldStatus} to ${status} (${vendor?.vendorName || "Vendor"}).`,
    });

    return res.status(200).json({
      message: `Status updated to '${status}'`,
      fieldGuidedSheet: {
        ...fieldGuidedSheet.toJSON(),
        status,
        items: await fetchFgsItems(fieldGuidedSheet.id),
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
