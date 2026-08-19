const {
  Op,
  sequelize,
  Product,
  Quotation,
  Customer,
  User,
  QuotationItem,
  QuotationVersion,
  logActivity,
  META_SLUGS,
  getMetaValue,
  generateGroupId,
  buildFloorsFromProducts,
  extractFirstImageUrl,
  calculateTotals,
  generateQuotationNumber,
} = require("./quotation.helpers");

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
    const productIds = [
      ...new Set(
        incomingProducts.map((p) => p.productId || p.id).filter(Boolean),
      ),
    ];

    const productMap = {};
    if (productIds.length > 0) {
      const dbProducts = await Product.findAll({
        where: { productId: productIds },
        attributes: [
          "productId",
          "name",
          "images",
          "product_code",
          "meta",
          "tax",
          "discountType",
        ],
        transaction: t,
      });

      dbProducts.forEach((p) => {
        const imageUrl = extractFirstImageUrl(p.images);

        productMap[p.productId] = {
          name: p.name?.trim() || "Unnamed Product",
          imageUrl, // Much more reliable now
          productCode: p.product_code || null,
          companyCode: getMetaValue(p.meta, META_SLUGS.companyCode), // optional improvement
          tax: p.tax || 0,
          discountType: p.discountType || "percent",
        };
      });
    }

    // ─── Enrich incoming products with location validation ───

    const enrichedProducts = incomingProducts.map((p, index) => {
      const id = p.productId || p.id;
      const db = productMap[id] || {};

      const price = Number(p.price || 0);
      const quantity = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || "percent";

      // === Option / Addon Handling ===
      const isOption =
        Boolean(p.isOption) ||
        Boolean(p.isOptionFor) ||
        Boolean(p.optionType && p.optionType !== "main");

      const optionType = p.optionType || null;
      const parentProductId = p.parentProductId || p.isOptionFor || null;

      // === Location Handling ===
      let locations = [];
      if (Array.isArray(p.locations) && p.locations.length > 0) {
        locations = p.locations
          .filter((loc) => loc.floorId && Number(loc.assignedQuantity) > 0)
          .map((loc) => ({
            floorId: loc.floorId,
            floorName: loc.floorName || `Floor ${loc.floorId}`,
            roomId: loc.roomId || null,
            roomName: loc.roomName || null,
            areaId: loc.areaId || null,
            areaName: loc.areaName || null,
            assignedQuantity: Number(loc.assignedQuantity),
          }));
      } else if (p.floorId) {
        // Backward compatibility
        locations = [
          {
            floorId: p.floorId,
            floorName: p.floorName || null,
            roomId: p.roomId || null,
            roomName: p.roomName || null,
            assignedQuantity: quantity,
          },
        ];
      }

      return {
        productId: id,
        name: p.name || db.name || "Unknown Product",
        imageUrl: p.imageUrl || db.imageUrl || null,
        companyCode: p.companyCode || db.companyCode || null,
        productCode: p.productCode || db.productCode || null,

        quantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: Number(p.tax || 0),

        priority: Number(p.priority ?? index),

        // === OPTION FIELDS - CRITICAL ===
        isOption: isOption,
        optionType: optionType,
        isOptionFor: isOption ? parentProductId : null,
        parentProductId: parentProductId,
        groupId: p.groupId || (isOption ? null : generateGroupId()),

        // Locations
        locations: locations.length > 0 ? locations : null,

        // Backward compatibility fields
        floorId: locations[0]?.floorId || null,
        floorName: locations[0]?.floorName || null,
        roomId: locations[0]?.roomId || null,
        roomName: locations[0]?.roomName || null,
      };
    });

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
      // stack: error.stack // uncomment only in development
    });
  }
};
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

    // ─── Versioning (outside transaction) ───
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
    const productIds = [
      ...new Set(
        incomingProducts.map((p) => p.productId || p.id).filter(Boolean),
      ),
    ];

    const productMap = {};
    if (productIds.length > 0) {
      const dbProducts = await Product.findAll({
        where: { productId: productIds },
        attributes: [
          "productId",
          "name",
          "images",
          "product_code",
          "meta",
          "tax",
          "discountType",
        ],
        transaction: t,
      });

      dbProducts.forEach((p) => {
        let imageUrl = null;
        if (p.images) {
          try {
            imageUrl = JSON.parse(p.images)?.[0] ?? null;
          } catch {}
        }
        productMap[p.productId] = {
          name: p.name?.trim() || "Unnamed Product",
          imageUrl,
          productCode: p.product_code || null,
          companyCode: p.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || null,
          tax: p.tax || 0,
          discountType: p.discountType || "percent",
        };
      });
    }

    // Enrich products
    // ─── Enrich incoming products with location validation ───
    // ─── Enrich incoming products with location validation ───
    const enrichedProducts = incomingProducts.map((p) => {
      const id = p.productId || p.id;
      const db = productMap[id] || {};

      const price = Number(p.price || 0);
      const totalQuantity = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || "percent";

      // === Location Quantity Validation ===
      let locations = [];
      let validatedTotalAssignedQty = 0;

      if (Array.isArray(p.locations) && p.locations.length > 0) {
        p.locations.forEach((loc) => {
          const assignedQty = Number(loc.assignedQuantity) || 0;
          if (assignedQty > 0) {
            validatedTotalAssignedQty += assignedQty;
            locations.push({
              floorId: loc.floorId,
              floorName: loc.floorName || `Floor ${loc.floorId}`,
              roomId: loc.roomId || null,
              roomName: loc.roomName || null,
              areaId: loc.areaId || null,
              areaName: loc.areaName || null,
              assignedQuantity: assignedQty,
            });
          }
        });
      }
      // Backward compatibility
      else if (p.floorId) {
        locations.push({
          floorId: p.floorId,
          floorName: p.floorName || null,
          roomId: p.roomId || null,
          roomName: p.roomName || null,
          assignedQuantity: totalQuantity,
        });
        validatedTotalAssignedQty = totalQuantity;
      }

      if (validatedTotalAssignedQty > totalQuantity) {
        throw new Error(
          `Quantity overflow for product ${p.name || id}. Total assigned (${validatedTotalAssignedQty}) > available (${totalQuantity})`,
        );
      }

      if (locations.length === 0) {
        locations = null;
      }

      const isOption = !!p.isOptionFor;

      return {
        productId: id,
        name: p.name || db.name || "Unknown Product",

        // ← FIXED: Now properly saving imageUrl and companyCode
        imageUrl: p.imageUrl || db.imageUrl || null,
        companyCode: p.companyCode || db.companyCode || null,
        productCode: p.productCode || db.productCode || null,

        quantity: totalQuantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: 0,
        priority: Number(p.priority ?? db.priority ?? 0),
        total: Number(
          discountType === "percent"
            ? price * totalQuantity * (1 - discount / 100)
            : (price - discount) * totalQuantity,
        ).toFixed(2),

        isOptionFor: isOption ? p.isOptionFor : null,
        optionType: p.optionType || null,
        groupId: p.groupId || (isOption ? null : generateGroupId()),

        locations, // New split support
        // Backward compatibility
        floorId: locations?.[0]?.floorId || null,
        floorName: locations?.[0]?.floorName || null,
        roomId: locations?.[0]?.roomId || null,
        roomName: locations?.[0]?.roomName || null,
      };
    });
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

// Get a single quotation by ID with items
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
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

    res.status(200).json({
      ...quotation.toJSON(),
      items,
      groupedItems,
      calculated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all quotations with their items
exports.getAllQuotations = async (req, res) => {
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
      return res.status(200).json({
        data: [],
        pagination: {
          total: totalQuotations,
          page,
          limit,
          totalPages: 0,
        },
      });
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

    return res.status(200).json({
      data: enrichedQuotations,
      pagination: {
        total: totalQuotations,
        page,
        limit,
        totalPages: Math.ceil(totalQuotations / limit),
      },
    });
  } catch (error) {
    console.error("Get All Quotations Error:", error);
    return res.status(500).json({
      message: "Error fetching quotations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a quotation and its items
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    // Check if user is admin or the creator
    if (
      !req.user.roles.includes("ADMIN") &&
      req.user.userId !== quotation.createdBy
    ) {
      return res.status(403).json({
        message:
          "Unauthorized: Only admins or the creator can delete this quotation",
      });
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
    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
