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
  enrichProductsForCreate,
} = require("../services/quotationEnrichment.service");
const { buildFloorsFromProducts } = require("../utils/floor.util");

// ─────────────────────────────────────────────
// CREATE QUOTATION
// ─────────────────────────────────────────────
exports.createQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let {
      products: incomingProducts,
      floors: incomingFloors = [],
      extraDiscount = 0,
      extraDiscountType = "percent",
      shippingAmount = 0,
      gst = 0,
      customerId,
      quotation_date,
      due_date,
      document_title = "Quotation",
      shipTo,
      signature_name = "",
      signature_image = "",
      ...rest
    } = req.body;

    // Parse products if sent as string (common with FormData)
    if (typeof incomingProducts === "string") {
      try {
        incomingProducts = JSON.parse(incomingProducts);
      } catch {
        return res.status(400).json({ error: "Invalid products JSON format" });
      }
    }

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }

    // Normalize due_date
    if (!due_date || due_date === "" || due_date === "null") {
      due_date = null;
    }
    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    // ─── Fetch product master data ───
    const productMap = await buildProductMasterMap(incomingProducts, {
      transaction: t,
    });

    // ─── Enrich incoming products with location validation ───
    const enrichedProducts = enrichProductsForCreate(
      incomingProducts,
      productMap,
    );

    // ─── Determine floors ───
    const floors =
      Array.isArray(incomingFloors) && incomingFloors.length > 0
        ? incomingFloors
        : buildFloorsFromProducts(enrichedProducts);

    // ─── Calculate totals ───
    const totals = calculateTotals(
      enrichedProducts,
      Number(extraDiscount),
      extraDiscountType,
      Number(shippingAmount),
      Number(gst),
    );

    // ─── Generate unique reference number ───
    const reference_number = await generateQuotationNumber(t);

    // ─── Create PostgreSQL quotation ───
    const quotation = await Quotation.create(
      {
        customerId,
        reference_number,
        document_title,
        quotation_date:
          quotation_date || new Date().toISOString().split("T")[0],
        due_date,
        products: enrichedProducts,
        floors,
        optionalTotal: totals.optionalTotal,
        optionalItemsCount: totals.optionalItemsCount,
        totalFloors: floors.length,
        extraDiscount: Number(extraDiscount) || 0,
        extraDiscountType: extraDiscountType || "percent",
        discountAmount: totals.extraDiscountAmount,
        shippingAmount: Number(shippingAmount) || 0,
        gst: Number(gst) || 0,
        gstAmount: totals.gstAmount,
        roundOff: totals.roundOff,
        finalAmount: totals.finalAmount,
        shipTo: shipTo || null,
        signature_name,
        signature_image,
        createdBy: req.user?.userId,
        ...rest,
      },
      { transaction: t },
    );

    // ─── Create MongoDB line items (NO session) ───
    await QuotationItem.create({
      quotationId: quotation.quotationId,
      items: enrichedProducts,
    });

    // ─── All good ───
    await t.commit();

    await logActivity({
      userId: req.user?.userId,
      contextTag: "SALES",
      subContext: "QUOTATION",
      action: "CREATE_QUOTATION",
      entityId: quotation.quotationId,
      entityName: quotation.reference_number,
      description: `Quotation ${quotation.reference_number} created for customer ${customerId}`,
      metadata: {
        referenceNumber: quotation.reference_number,
        customerId,
        productCount: enrichedProducts.length,
        floorCount: floors.length,
        financials: {
          totalAmount: totals.finalAmount,
          gst: Number(gst) || 0,
          gstAmount: totals.gstAmount,
          discount: Number(extraDiscount) || 0,
          discountType: extraDiscountType,
          shipping: Number(shippingAmount) || 0,
        },
        structure: {
          hasLocations: enrichedProducts.some((p) => p.locations?.length),
          hasOptions: enrichedProducts.some((p) => p.isOptionFor),
        },
        createdBy: req.user?.userId || null,
      },
    });

    return res.status(201).json({
      message: "Quotation created successfully",
      quotation: {
        ...quotation.toJSON(),
        finalAmount: totals.finalAmount,
      },
      calculated: totals,
    });
  } catch (error) {
    await t.rollback().catch(() => {});

    return res.status(500).json({
      error: "Failed to create quotation",
      message: error.message,
    });
  }
};
