const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");
const { Quotation } = require("../models");
const QuotationItem = require("../models/quotationItem");
const logActivity = require("../utils/activityLogger");

const { calculateTotals } = require("../services/quotationCalculation.service");
const {
  generateQuotationNumber,
} = require("../services/quotationNumber.service");
const { buildProductMasterMap } = require("../services/productMaster.service");
const {
  enrichProductsForClone,
} = require("../services/quotationEnrichment.service");
const { buildFloorsFromProducts } = require("../utils/floor.util");

// CLONE QUOTATION – Works like createQuotation (MySQL)
exports.cloneQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Fetch original quotation
    const original = await Quotation.findByPk(id, { transaction: t });

    if (!original) {
      await t.rollback();
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Fetch items from MongoDB (or fallback to PG field)
    const originalItemsDoc = await QuotationItem.findOne({ quotationId: id });
    let originalProducts = originalItemsDoc?.items || original.products || [];

    if (!Array.isArray(originalProducts) || originalProducts.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "No products found in original quotation" });
    }

    // Parse if stored as string (safety for MySQL)
    if (typeof originalProducts === "string") {
      try {
        originalProducts = JSON.parse(originalProducts);
      } catch (e) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "Invalid products data in original quotation" });
      }
    }

    // ─── Fetch latest product master data ───
    const productMap = await buildProductMasterMap(originalProducts, {
      transaction: t,
    });

    // ─── Enrich products (same logic as createQuotation) ───
    const enrichedProducts = enrichProductsForClone(
      originalProducts,
      productMap,
    );

    // ─── Determine floors ───
    const floors =
      Array.isArray(original.floors) && original.floors.length > 0
        ? original.floors
        : buildFloorsFromProducts(enrichedProducts);

    // ─── Calculate fresh totals ───
    const totals = calculateTotals(
      enrichedProducts,
      Number(original.extraDiscount || 0),
      original.extraDiscountType || "percent",
      Number(original.shippingAmount || 0),
      Number(original.gst || 0),
    );

    // ─── Generate new reference number ───
    const reference_number = await generateQuotationNumber(t);

    const newId = uuidv4();

    // ─── Create new Quotation ───
    const cloned = await Quotation.create(
      {
        quotationId: newId,
        document_title: `${original.document_title} (Duplicate)`,
        quotation_date: new Date().toISOString().split("T")[0],
        due_date: original.due_date,
        reference_number,
        customerId: original.customerId,
        createdBy: req.user?.userId,
        shipTo: original.shipTo,

        products: enrichedProducts,
        floors,
        totalFloors: floors.length,

        extraDiscount: Number(original.extraDiscount) || 0,
        extraDiscountType: original.extraDiscountType || "percent",
        discountAmount: totals.extraDiscountAmount,
        shippingAmount: Number(original.shippingAmount) || 0,
        gst: Number(original.gst) || 0,
        gstAmount: totals.gstAmount,
        roundOff: totals.roundOff,
        finalAmount: totals.finalAmount,

        signature_name: original.signature_name || "",
        signature_image: original.signature_image || "",
        followupDates: original.followupDates || null,
      },
      { transaction: t },
    );

    // ─── Create MongoDB Line Items ───
    await QuotationItem.create({
      quotationId: newId,
      items: enrichedProducts,
    });

    await t.commit();

    await logActivity({
      userId: req.user?.userId,
      contextTag: "SALES",
      subContext: "QUOTATION",
      action: "CLONE_QUOTATION",
      entityId: cloned.quotationId,
      entityName: reference_number,
      description: `Quotation cloned from ${original.reference_number}`,
      metadata: {
        originalQuotationId: id,
        originalReferenceNumber: original.reference_number,
        newQuotationId: cloned.quotationId,
        newReferenceNumber: reference_number,
        customerId: original.customerId,
        finalAmount: totals.finalAmount,
        gstAmount: totals.gstAmount,
        discountAmount: totals.extraDiscountAmount,
        productCount: enrichedProducts.length,
        floorCount: floors.length,
        cloneType: "FULL_DUPLICATE",
        includesPricingRecalculation: true,
      },
      req,
    });

    return res.status(201).json({
      message: "Quotation cloned successfully",
      clonedQuotation: {
        ...cloned.toJSON(),
        finalAmount: totals.finalAmount,
      },
      calculated: totals,
    });
  } catch (error) {
    await t.rollback().catch(() => {});

    return res.status(500).json({
      error: "Failed to clone quotation",
      message: error.message,
    });
  }
};
