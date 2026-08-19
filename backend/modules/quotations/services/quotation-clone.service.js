const {
  uuidv4,
  sequelize,
  Product,
  Quotation,
  QuotationItem,
  logActivity,
  META_SLUGS,
  getMetaValue,
  generateGroupId,
  buildFloorsFromProducts,
  extractFirstImageUrl,
  calculateTotals,
  generateQuotationNumber,
} = require("./quotation.helpers");

// CLONE QUOTATION – Works like createQuotation (MySQL)
exports.cloneQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Fetch original quotation
    const original = await Quotation.findByPk(id, {
      transaction: t,
    });

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
    const productIds = [
      ...new Set(
        originalProducts.map((p) => p.productId || p.id).filter(Boolean),
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
          imageUrl,
          productCode: p.product_code || null,
          companyCode: getMetaValue(p.meta, META_SLUGS.companyCode),
          tax: p.tax || 0,
          discountType: p.discountType || "percent",
        };
      });
    }

    // ─── Enrich products (same logic as createQuotation) ───
    const enrichedProducts = originalProducts.map((p) => {
      const id = p.productId || p.id;
      const db = productMap[id] || {};

      const price = Number(p.price || 0);
      const totalQuantity = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || "percent";

      // Location handling
      let locations = null;
      let validatedTotalAssignedQty = 0;

      if (Array.isArray(p.locations) && p.locations.length > 0) {
        p.locations.forEach((loc) => {
          const assignedQty = Number(loc.assignedQuantity) || 0;
          if (assignedQty > 0) validatedTotalAssignedQty += assignedQty;
        });
        locations = p.locations;
      } else if (p.floorId) {
        locations = [
          {
            floorId: p.floorId,
            floorName: p.floorName || null,
            roomId: p.roomId || null,
            roomName: p.roomName || null,
            assignedQuantity: totalQuantity,
          },
        ];
      }

      if (validatedTotalAssignedQty > totalQuantity) {
        throw new Error(`Quantity overflow for product ${p.name || id}`);
      }

      if (locations && locations.length === 0) locations = null;

      const isOption = Boolean(p.isOption) || Boolean(p.isOptionFor);

      return {
        productId: id,
        name: p.name || db.name || "Unknown Product",
        imageUrl: p.imageUrl || db.imageUrl || null,
        companyCode: p.companyCode || db.companyCode || null,
        productCode: p.productCode || db.productCode || null,

        quantity: totalQuantity,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: 0,
        priority: Number(p.priority ?? 0),
        total: Number(
          discountType === "percent"
            ? price * totalQuantity * (1 - discount / 100)
            : (price - discount) * totalQuantity,
        ).toFixed(2),

        isOptionFor: isOption ? p.isOptionFor || p.parentProductId : null,
        optionType: p.optionType || null,
        groupId: p.groupId || (isOption ? null : generateGroupId()),

        locations,
        floorId: locations?.[0]?.floorId || null,
        floorName: locations?.[0]?.floorName || null,
        roomId: locations?.[0]?.roomId || null,
        roomName: locations?.[0]?.roomName || null,
      };
    });

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
