const sequelize = require("../config/database");
const { Quotation } = require("../models");
const QuotationItem = require("../models/quotationItem");
const QuotationVersion = require("../models/quotationVersion");
const logActivity = require("../utils/activityLogger");

const { calculateTotals } = require("../services/quotationCalculation.service");
const { buildProductMasterMap } = require("../services/productMaster.service");
const {
  enrichProductsForUpdate,
} = require("../services/quotationEnrichment.service");
const { buildFloorsFromProducts } = require("../utils/floor.util");

// ─────────────────────────────────────────────
// UPDATE QUOTATION
// ─────────────────────────────────────────────
exports.updateQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    let {
      products: incomingProducts,
      floors: incomingFloors = [],
      followupDates = [],
      extraDiscount = 0,
      extraDiscountType = "percent",
      shippingAmount = 0,
      gst = 0,
      ...quotationData
    } = req.body;

    if (!id) {
      await t.rollback();
      return res.status(400).json({ message: "Quotation ID is required" });
    }

    const currentQuotation = await Quotation.findOne({
      where: { quotationId: id },
      transaction: t,
    });

    if (!currentQuotation) {
      await t.rollback();
      return res.status(404).json({ message: "Quotation not found" });
    }

    // ─── Versioning (non-fatal if it fails) ───
    let newVersionNumber = 1;
    try {
      const latest = await QuotationVersion.findOne({ quotationId: id })
        .sort({ version: -1 })
        .lean();

      if (latest) newVersionNumber = latest.version + 1;

      const currentMongoItems = await QuotationItem.findOne({
        quotationId: id,
      }).lean();

      const rawQuotation = await Quotation.findOne({
        where: { quotationId: id },
        attributes: [
          "quotationId",
          "reference_number",
          "customerId",
          "products",
          "floors",
          "totalFloors",
          "extraDiscount",
          "extraDiscountType",
          "discountAmount",
          "shippingAmount",
          "gst",
          "gstAmount",
          "roundOff",
          "finalAmount",
          "followupDates",
          "createdAt",
          "updatedAt",
        ],
        raw: true,
        transaction: t,
      });

      const safeData = {
        ...rawQuotation,
        createdAt: rawQuotation.createdAt?.toISOString() ?? null,
        updatedAt: rawQuotation.updatedAt?.toISOString() ?? null,
      };

      await QuotationVersion.create({
        quotationId: id,
        version: newVersionNumber,
        quotationData: safeData,
        quotationItems: currentMongoItems?.items || [],
        floors: safeData.floors || [],
        totalFloors: safeData.totalFloors || 0,
        updatedBy: req.user?.userId,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Versioning failed:", err);
      // non-fatal
    }

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }

    // Fetch product master data (same as create)
    const productMap = await buildProductMasterMap(incomingProducts, {
      transaction: t,
    });

    // Enrich products (throws on location-quantity overflow)
    const enrichedProducts = enrichProductsForUpdate(
      incomingProducts,
      productMap,
    );

    // Floors: prefer incoming → fallback to derived
    let floors =
      Array.isArray(incomingFloors) && incomingFloors.length > 0
        ? incomingFloors
        : buildFloorsFromProducts(enrichedProducts);

    const totals = calculateTotals(
      enrichedProducts,
      Number(extraDiscount),
      extraDiscountType,
      Number(shippingAmount),
      Number(gst),
    );

    await Quotation.update(
      {
        ...quotationData,
        products: enrichedProducts,
        floors,
        totalFloors: floors.length,
        extraDiscount: Number(extraDiscount) || 0,
        extraDiscountType: extraDiscountType || "percent",
        discountAmount: totals.extraDiscountAmount,
        shippingAmount: Number(shippingAmount) || 0,
        gst: Number(gst) || 0,
        gstAmount: totals.gstAmount,
        roundOff: totals.roundOff,
        finalAmount: totals.finalAmount,
        followupDates: followupDates.length > 0 ? followupDates : null,
      },
      { where: { quotationId: id }, transaction: t },
    );

    // Sync MongoDB items
    try {
      if (enrichedProducts.length > 0) {
        await QuotationItem.updateOne(
          { quotationId: id },
          { $set: { items: enrichedProducts } },
          { upsert: true },
        );
      } else {
        await QuotationItem.deleteOne({ quotationId: id });
      }
    } catch (mongoErr) {
      console.error("MongoDB sync failed:", mongoErr);
    }

    await t.commit();

    await logActivity({
      userId: req.user?.userId,
      contextTag: "SALES",
      subContext: "QUOTATION",
      action: "UPDATE_QUOTATION",
      entityId: currentQuotation.quotationId,
      entityName: currentQuotation.reference_number || id,
      description: `Quotation ${id} updated (version ${newVersionNumber})`,
      oldValues: {
        finalAmount: currentQuotation.finalAmount,
        extraDiscount: currentQuotation.extraDiscount,
        gst: currentQuotation.gst,
        shippingAmount: currentQuotation.shippingAmount,
      },
      newValues: {
        finalAmount: totals.finalAmount,
        extraDiscount,
        gst,
        shippingAmount,
      },
      metadata: {
        quotationId: id,
        version: newVersionNumber,
        productCount: enrichedProducts.length,
        floorCount: floors.length,
        versionCreated: true,
        financialImpact: {
          gstAmount: totals.gstAmount,
          discountAmount: totals.extraDiscountAmount,
          roundOff: totals.roundOff,
          finalAmount: totals.finalAmount,
        },
        mongoSynced: true,
        productStructureChanged: true,
        locationBasedQuotation: enrichedProducts.some((p) => p.locations),
      },
      req,
    });

    return res.status(200).json({
      message: "Quotation updated successfully",
      version: newVersionNumber,
      finalAmount: totals.finalAmount,
      calculated: totals,
    });
  } catch (error) {
    await t.rollback().catch(() => {});
    return res.status(500).json({
      error: "Failed to update quotation",
      details: error.message,
    });
  }
};
