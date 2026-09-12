const { v4: uuidv4 } = require("uuid");
const sequelize = require("../../../config/database");
const { Quotation, Customer, User } = require("../../../models");
const QuotationItem = require("../models/quotation-item.model");
const QuotationVersion = require("../models/quotation-version.model");
const logActivity = require("../../../utils/activityLogger");
const { Op } = require("sequelize");

const { calculateTotals } = require("../helpers/calculation.helpers");
const { buildFloorsFromProducts } = require("../helpers/floor.helpers");
const { generateQuotationNumber } = require("./quotation-number.service");
const {
  fetchProductMap,
  fetchProductMapForUpdate,
  enrichProductsForCreate,
  enrichProductsForUpdate,
  enrichProductsForClone,
} = require("./product-enrichment.service");
const { createVersionSnapshot } = require("./versioning.service");

// ─────────────────────────────────────────────
// CREATE QUOTATION
// ─────────────────────────────────────────────
async function createQuotation(req) {
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
        return {
          status: 400,
          body: { error: "Invalid products JSON format" },
        };
      }
    }

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      return {
        status: 400,
        body: { error: "At least one product is required" },
      };
    }
    // Normalize due_date
    if (!due_date || due_date === "" || due_date === "null") {
      due_date = null;
    }
    if (!customerId) {
      return {
        status: 400,
        body: { error: "Customer ID is required" },
      };
    }

    // ─── Fetch product master data ───
    const productIds = [
      ...new Set(
        incomingProducts.map((p) => p.productId || p.id).filter(Boolean),
      ),
    ];

    const productMap = await fetchProductMap(productIds, t);

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
        // Add these new fields
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
    return {
      status: 201,
      body: {
        message: "Quotation created successfully",
        quotation: {
          ...quotation.toJSON(),
          finalAmount: totals.finalAmount,
        },
        calculated: totals,
      },
    };
  } catch (error) {
    await t.rollback().catch(() => {});

    return {
      status: 500,
      body: {
        error: "Failed to create quotation",
        message: error.message,
        // stack: error.stack // uncomment only in development
      },
    };
  }
}

// ─────────────────────────────────────────────
// UPDATE QUOTATION
// ─────────────────────────────────────────────
async function updateQuotation(req) {
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
      return {
        status: 400,
        body: { message: "Quotation ID is required" },
      };
    }

    const currentQuotation = await Quotation.findOne({
      where: { quotationId: id },
      transaction: t,
    });

    if (!currentQuotation) {
      await t.rollback();
      return {
        status: 404,
        body: { message: "Quotation not found" },
      };
    }

    // ─── Versioning (outside transaction) ───
    const newVersionNumber = await createVersionSnapshot(id, req, t);

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      await t.rollback();
      return {
        status: 400,
        body: { error: "At least one product is required" },
      };
    }

    // Fetch product master data (same as create)
    const productIds = [
      ...new Set(
        incomingProducts.map((p) => p.productId || p.id).filter(Boolean),
      ),
    ];

    const productMap = await fetchProductMapForUpdate(productIds, t);

    // Enrich products
    // ─── Enrich incoming products with location validation ───
    // ─── Enrich incoming products with location validation ───
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
    return {
      status: 200,
      body: {
        message: "Quotation updated successfully",
        version: newVersionNumber,
        finalAmount: totals.finalAmount,
        calculated: totals,
      },
    };
  } catch (error) {
    await t.rollback().catch(() => {});
    return {
      status: 500,
      body: {
        error: "Failed to update quotation",
        details: error.message,
      },
    };
  }
}

// ─────────────────────────────────────────────
// CLONE QUOTATION
// ─────────────────────────────────────────────
async function cloneQuotation(req) {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Fetch original quotation
    const original = await Quotation.findByPk(id, {
      transaction: t,
    });

    if (!original) {
      await t.rollback();
      return {
        status: 404,
        body: { message: "Quotation not found" },
      };
    }

    // Fetch items from MongoDB (or fallback to PG field)
    const originalItemsDoc = await QuotationItem.findOne({ quotationId: id });
    let originalProducts = originalItemsDoc?.items || original.products || [];

    if (!Array.isArray(originalProducts) || originalProducts.length === 0) {
      await t.rollback();
      return {
        status: 400,
        body: { message: "No products found in original quotation" },
      };
    }

    // Parse if stored as string (safety for MySQL)
    if (typeof originalProducts === "string") {
      try {
        originalProducts = JSON.parse(originalProducts);
      } catch (e) {
        await t.rollback();
        return {
          status: 400,
          body: { error: "Invalid products data in original quotation" },
        };
      }
    }

    // ─── Fetch latest product master data ───
    const productIds = [
      ...new Set(
        originalProducts.map((p) => p.productId || p.id).filter(Boolean),
      ),
    ];

    const productMap = await fetchProductMap(productIds, t);

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
    return {
      status: 201,
      body: {
        message: "Quotation cloned successfully",
        clonedQuotation: {
          ...cloned.toJSON(),
          finalAmount: totals.finalAmount,
        },
        calculated: totals,
      },
    };
  } catch (error) {
    await t.rollback().catch(() => {});

    return {
      status: 500,
      body: {
        error: "Failed to clone quotation",
        message: error.message,
      },
    };
  }
}

// ─────────────────────────────────────────────
// RESTORE VERSION
// ─────────────────────────────────────────────
async function restoreQuotationVersion(req) {
  const t = await sequelize.transaction();
  try {
    const { id, version } = req.params;

    const versionData = await QuotationVersion.findOne({
      quotationId: id,
      version: Number(version),
    });
    if (!versionData) {
      await t.rollback();
      return {
        status: 404,
        body: { message: "Version not found" },
      };
    }

    await Quotation.update(
      {
        ...versionData.quotationData,
        floors: versionData.floors || [], // ← restored
        totalFloors: versionData.totalFloors || 0, // ← restored
      },
      { where: { quotationId: id }, transaction: t },
    );

    if (versionData.quotationItems?.length > 0) {
      await QuotationItem.updateOne(
        { quotationId: id },
        { $set: { items: versionData.quotationItems } },
        { upsert: true },
      );
    } else {
      await QuotationItem.deleteOne({ quotationId: id });
    }

    await t.commit();

    // Note: sendNotification is assumed to be available in the original context
    // Keeping the call signature identical
    if (typeof sendNotification === "function") {
      await sendNotification({
        userId: req.user.userId,
        title: "Quotation Restored",
        message: `Quotation "${id}" restored to version ${version}.`,
      });
    }

    return {
      status: 200,
      body: { message: `Quotation restored to version ${version}` },
    };
  } catch (error) {
    await t.rollback();
    return {
      status: 500,
      body: {
        error: "Failed to restore quotation",
        details: error.message,
      },
    };
  }
}

// ─────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────
async function getQuotationById(req) {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) {
      return {
        status: 404,
        body: { message: "Quotation not found" },
      };
    }

    const mongoDoc = await QuotationItem.findOne({
      quotationId: req.params.id,
    });
    const items = mongoDoc?.items || [];

    // Group for frontend convenience
    const grouped = {};
    items.forEach((item) => {
      const gid = item.groupId || "ungrouped";
      if (!grouped[gid]) grouped[gid] = { main: null, options: [] };
      if (!item.isOptionFor) {
        grouped[gid].main = item;
      } else {
        grouped[gid].options.push(item);
      }
    });

    const groupedItems = Object.values(grouped);

    const calculated = calculateTotals(
      items,
      quotation.extraDiscount,
      quotation.extraDiscountType,
      quotation.shippingAmount,
      quotation.gst,
    );

    return {
      status: 200,
      body: {
        ...quotation.toJSON(),
        items,
        groupedItems,
        calculated,
      },
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: error.message },
    };
  }
}

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
async function getAllQuotations(req) {
  try {
    // =====================================
    // Pagination
    // =====================================
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 500; // Good for reports
    const offset = (page - 1) * limit;

    // =====================================
    // WHERE Conditions
    // =====================================
    const where = {};

    const search = req.query.search?.trim();
    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { document_title: { [Op.like]: searchTerm } },
        { reference_number: { [Op.like]: searchTerm } },
      ];
    }

    if (req.query.customerId) {
      where.customerId = req.query.customerId;
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      where.quotation_date = {};
      if (req.query.startDate) {
        where.quotation_date[Op.gte] = req.query.startDate;
      }
      if (req.query.endDate) {
        where.quotation_date[Op.lte] = req.query.endDate;
      }
    }

    // =====================================
    // Main Query with Associations
    // =====================================
    const { count: totalQuotations, rows: quotations } =
      await Quotation.findAndCountAll({
        where,
        offset,
        limit,
        order: [["quotation_date", "DESC"]],
        subQuery: false,

        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["customerId", "name", "companyName", "mobileNumber"],
            required: false,
          },
          {
            model: User,
            as: "creator", // Must match Quotation model
            attributes: ["userId", "name", "username"],
            required: false,
          },
        ],
      });

    if (quotations.length === 0) {
      return {
        status: 200,
        body: {
          data: [],
          pagination: {
            total: totalQuotations,
            page,
            limit,
            totalPages: 0,
          },
        },
      };
    }

    // =====================================
    // MongoDB Items Enrichment
    // =====================================
    const quotationIds = quotations.map((q) => q.quotationId);

    const mongoItems = await QuotationItem.find({
      quotationId: { $in: quotationIds },
    }).lean();

    const itemsMap = {};
    mongoItems.forEach((itemDoc) => {
      itemsMap[itemDoc.quotationId] = itemDoc.items || [];
    });

    // =====================================
    // Final Response with Flattened Fields
    // =====================================
    const enrichedQuotations = quotations.map((q) => {
      const plain = q.toJSON();

      return {
        ...plain,
        items: itemsMap[plain.quotationId] || [],

        // Flattened fields (Best for Reports / PDF)
        customerName:
          plain.customer?.name ||
          plain.customer?.companyName ||
          "Walk-in Customer",

        createdByName: plain.creator?.name || "Unknown",

        // Keep original nested objects for flexibility
        customer: plain.customer,
        creator: plain.creator,
      };
    });

    return {
      status: 200,
      body: {
        data: enrichedQuotations,
        pagination: {
          total: totalQuotations,
          page,
          limit,
          totalPages: Math.ceil(totalQuotations / limit),
        },
      },
    };
  } catch (error) {
    console.error("Get All Quotations Error:", error);
    return {
      status: 500,
      body: {
        message: "Error fetching quotations",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
    };
  }
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
async function deleteQuotation(req) {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) {
      return {
        status: 404,
        body: { message: "Quotation not found" },
      };
    }
    // Check if user is admin, super admin, or the creator
    if (
      !req.user.roles.includes("ADMIN") &&
      !req.user.roles.includes("SUPER_ADMIN") &&
      req.user.userId !== quotation.createdBy
    ) {
      return {
        status: 403,
        body: {
          message:
            "Unauthorized: Only admins, super admins, or the creator can delete this quotation",
        },
      };
    }
    await Quotation.destroy({
      where: { quotationId: req.params.id },
    });
    await QuotationItem.deleteOne({ quotationId: req.params.id });
    await logActivity({
      userId: req.user?.userId,
      contextTag: "SALES",
      subContext: "QUOTATION",
      action: "DELETE_QUOTATION",
      entityId: quotation.quotationId,
      entityName: quotation.reference_number || quotation.quotationId,
      description: `Quotation ${quotation.reference_number || quotation.quotationId} deleted`,

      oldValues: {
        quotationId: quotation.quotationId,
        referenceNumber: quotation.reference_number,
        createdBy: quotation.createdBy,
        customerId: quotation.customerId,
      },

      metadata: {
        deletionType: "HARD_DELETE",

        isAdminAction: req.user.roles.includes("ADMIN"),
        isOwnerAction: req.user.userId === quotation.createdBy,

        warning: "Quotation permanently deleted",

        hasMongoCleanup: true,
      },

      req,
    });
    return {
      status: 200,
      body: { message: "Quotation deleted successfully" },
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: error.message },
    };
  }
}

// ─────────────────────────────────────────────
// GET VERSIONS
// ─────────────────────────────────────────────
async function getQuotationVersions(req) {
  try {
    const { id } = req.params;

    const versions = await QuotationVersion.find({ quotationId: id })
      .sort({ version: -1 }) // ← NEWEST FIRST (critical for UX)
      .lean(); // ← Important: removes Mongoose wrappers

    if (!versions || versions.length === 0) {
      return {
        status: 404,
        body: { message: "No versions found" },
      };
    }

    // Transform to clean, predictable shape
    const cleanedVersions = versions.map((v) => ({
      version: v.version,
      updatedBy: v.updatedBy || "Unknown",
      updatedAt: v.updatedAt,
      // Use saved PostgreSQL data if available, fallback to stored
      finalAmount: v.quotationData?.finalAmount || 0,
      document_title: v.quotationData?.document_title || "Untitled Quotation",
      customerId: v.quotationData?.customerId,
      quotation_date: v.quotationData?.quotation_date,
      // Items count
      itemCount: (v.quotationItems || []).length,
      // Full data for restore
      quotationData: v.quotationData,
      quotationItems: v.quotationItems || [],
    }));

    return {
      status: 200,
      body: cleanedVersions,
    };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: "Failed to retrieve versions",
        details: error.message,
      },
    };
  }
}

module.exports = {
  createQuotation,
  updateQuotation,
  cloneQuotation,
  restoreQuotationVersion,
  getQuotationById,
  getAllQuotations,
  deleteQuotation,
  getQuotationVersions,
};
