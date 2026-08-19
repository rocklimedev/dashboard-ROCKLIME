const {
  sequelize,
  sendNotification,
  Vendor,
  FieldGuidedSheet,
  createPurchaseOrderFromData,
  logActivity,
  ADMIN_USER_ID,
  FGS_STATUSES,
  VALID_FGS_STATUSES,
  fetchFgsItems,
} = require("./fgs.helpers");

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
