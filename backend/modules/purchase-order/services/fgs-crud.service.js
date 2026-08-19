const {
  sequelize,
  sendNotification,
  Product,
  Vendor,
  FieldGuidedSheet,
  User,
  FgsItem,
  logActivity,
  ADMIN_USER_ID,
  FGS_STATUSES,
  VALID_FGS_STATUSES,
  generateDailyFGSNumber,
  validateAndCalculateItems,
  fetchFgsItems,
} = require("./fgs.helpers");

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
