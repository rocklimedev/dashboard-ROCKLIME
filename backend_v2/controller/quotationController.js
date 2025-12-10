const { v4: uuidv4 } = require("uuid");
const Quotation = require("../models/quotation");
const QuotationItem = require("../models/quotationItem");
const QuotationVersion = require("../models/quotationVersion");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");
const Product = require("../models/product");
// ---------------------------------------------------------------------
// Helper: Calculate totals (uses `total` if provided, else price × qty)
// ---------------------------------------------------------------------
// Helper: Calculate totals (ROUND-OFF BEFORE GST, GST LAST)
// ---------------------------------------------------------------------
const calculateTotals = (
  products,
  extraDiscount = 0,
  extraDiscountType = "percent",
  shippingAmount = 0,
  gst = 0
) => {
  let subTotalBeforeDiscount = 0;
  let totalItemDiscount = 0;
  let taxableAmountTotal = 0;
  let itemTaxTotal = 0;

  products.forEach((p) => {
    const price = Number(p.price) || 0;
    const qty = Number(p.quantity) || 1;
    const discount = Number(p.discount) || 0;
    const discountType = p.discountType || "percent";
    const taxRate = Number(p.tax) || 0;

    const originalLineTotal = price * qty;
    subTotalBeforeDiscount += originalLineTotal;

    let lineTotalAfterDiscount;
    let discountAmount;

    if (discountType === "percent") {
      discountAmount = originalLineTotal * (discount / 100);
      lineTotalAfterDiscount = originalLineTotal - discountAmount;
    } else {
      discountAmount = discount * qty;
      lineTotalAfterDiscount = originalLineTotal - discountAmount;
    }

    totalItemDiscount += discountAmount;
    taxableAmountTotal += lineTotalAfterDiscount;

    const taxAmount =
      taxRate > 0 ? (lineTotalAfterDiscount * taxRate) / 100 : 0;
    itemTaxTotal += taxAmount;
  });

  const baseForExtraDiscount =
    taxableAmountTotal + itemTaxTotal + Number(shippingAmount || 0);

  const extraDiscountAmount =
    extraDiscountType === "percent"
      ? parseFloat(((baseForExtraDiscount * extraDiscount) / 100).toFixed(2))
      : parseFloat(extraDiscount.toFixed(2));

  const amountBeforeGstRaw = baseForExtraDiscount - extraDiscountAmount;
  const amountBeforeGst = parseFloat(amountBeforeGstRaw.toFixed(2));

  const rupees = Math.floor(amountBeforeGst);
  const paise = Math.round((amountBeforeGst - rupees) * 100);

  let roundOff = 0;
  if (paise > 0 && paise <= 50) {
    roundOff = parseFloat((-paise / 100).toFixed(2));
  } else if (paise > 50) {
    roundOff = parseFloat(((100 - paise) / 100).toFixed(2));
  }

  const roundedAmount = parseFloat((amountBeforeGst + roundOff).toFixed(2));
  const gstAmount =
    gst > 0 ? parseFloat(((roundedAmount * gst) / 100).toFixed(2)) : 0;
  const finalAmount = parseFloat((roundedAmount + gstAmount).toFixed(2));

  return {
    subTotal: parseFloat(subTotalBeforeDiscount.toFixed(2)),
    totalItemDiscount: parseFloat(totalItemDiscount.toFixed(2)),
    itemTax: parseFloat(itemTaxTotal.toFixed(2)),
    extraDiscountAmount,
    amountBeforeGst,
    roundOff,
    roundedAmount,
    gstAmount,
    finalAmount,
  };
};

// ---------------------------------------------------------------------
// CREATE QUOTATION – FULLY FIXED
// ---------------------------------------------------------------------

exports.createQuotation = async (req, res) => {
  const t = await sequelize.transaction();
  let mongoItem;

  try {
    let {
      products,
      extraDiscount = 0,
      extraDiscountType = "percent",
      shippingAmount = 0,
      gst = 0,
      // ← IGNORE clientRoundOff & clientFinalAmount → WE TRUST SERVER ONLY
      ...quotationData
    } = req.body;

    // ---------- 1. Safe parsing ----------
    if (typeof products === "string") {
      try {
        products = JSON.parse(products);
      } catch {
        return res.status(400).json({ error: "Invalid products JSON" });
      }
    }

    // ---------- 2. Validation ----------
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }
    if (!quotationData.customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    // ---------- 3. Fetch product names & images ----------
    const productIds = [
      ...new Set(products.map((p) => p.productId || p.id).filter(Boolean)),
    ];
    const productMap = {};

    if (productIds.length > 0) {
      const dbProducts = await Product.findAll({
        where: { productId: productIds },
        attributes: ["productId", "name", "images"],
        transaction: t,
      });

      dbProducts.forEach((p) => {
        let imageUrl = null;
        if (p.images) {
          try {
            const imgs = JSON.parse(p.images);
            if (Array.isArray(imgs) && imgs.length) imageUrl = imgs[0];
          } catch {}
        }
        productMap[p.productId] = {
          name: p.name?.trim() || "Unnamed Product",
          imageUrl,
        };
      });
    }

    // ---------- 4. Enrich products ----------
    const enrichedProducts = products.map((p) => {
      const id = p.productId || p.id;
      const db = productMap[id] || {};

      // Calculate correct line total AFTER item discount (same as frontend)
      const price = Number(p.price || 0);
      const qty = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || "percent";

      let lineTotalAfterDiscount;
      if (discountType === "percent") {
        lineTotalAfterDiscount = price * qty * (1 - discount / 100);
      } else {
        lineTotalAfterDiscount = (price - discount) * qty;
      }

      return {
        productId: id,
        name: p.name || db.name || "Unknown Product",
        imageUrl: p.imageUrl || db.imageUrl,
        quantity: qty,
        price: parseFloat(price.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        discountType,
        tax: Number(p.tax || 0),
        total: parseFloat(lineTotalAfterDiscount.toFixed(2)), // ← Use correct total
      };
    });

    // ---------- 5. SERVER-SIDE CALCULATION (TRUSTED) ----------
    const {
      subTotal,
      totalItemDiscount,
      itemTax,
      extraDiscountAmount,
      roundOff,
      gstAmount,
      finalAmount, // ← THIS IS THE SOURCE OF TRUTH
    } = calculateTotals(
      enrichedProducts,
      Number(extraDiscount),
      extraDiscountType,
      Number(shippingAmount),
      Number(gst)
    );

    // ---------- 6. Save to PostgreSQL ----------
    const quotation = await Quotation.create(
      {
        ...quotationData,
        products: enrichedProducts,
        extraDiscount: Number(extraDiscount) || 0,
        extraDiscountType: extraDiscountType || "percent",
        discountAmount: parseFloat(extraDiscountAmount.toFixed(2)),
        shippingAmount: Number(shippingAmount) || 0,
        gst: Number(gst) || 0,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        roundOff: parseFloat(roundOff.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)), // ← SERVER VALUE
        subTotal: parseFloat(subTotal.toFixed(2)),
      },
      { transaction: t }
    );

    // ---------- 7. Save items to MongoDB ----------
    await QuotationItem.create({
      quotationId: quotation.quotationId,
      items: enrichedProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        imageUrl: p.imageUrl,
        quantity: p.quantity,
        price: p.price,
        discount: p.discount,
        discountType: p.discountType,
        tax: p.tax,
        total: p.total, // ← FIX: was null
      })),
    });

    await t.commit();

    return res.status(201).json({
      message: "Quotation created successfully",
      quotation: {
        ...quotation.toJSON(),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
      },
      calculated: {
        subTotal,
        totalItemDiscount,
        itemTax,
        extraDiscountAmount,
        shippingAmount,
        gstAmount,
        roundOff,
        finalAmount,
      },
    });
  } catch (error) {
    if (t) await t.rollback();
    if (mongoItem) {
      await QuotationItem.deleteOne({ _id: mongoItem._id }).catch(() => {});
    }

    return res.status(500).json({
      error: "Failed to create quotation",
      details: error.message,
    });
  }
};

// ========== UPDATE FUNCTION ==========
exports.updateQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      products: incomingProducts,
      followupDates = [],
      extraDiscount = 0,
      extraDiscountType = "percent",
      shippingAmount = 0,
      gst = 0,
      roundOff = 0,
      ...quotationData
    } = req.body;

    if (!id) {
      await t.rollback();
      return res.status(400).json({ message: "Quotation ID is required" });
    }

    // 1. Fetch current quotation (PostgreSQL)
    const currentQuotation = await Quotation.findOne({
      where: { quotationId: id },
      transaction: t,
    });

    if (!currentQuotation) {
      await t.rollback();
      return res.status(404).json({ message: "Quotation not found" });
    }

    // 2. Fetch current items from MongoDB
    const currentMongoItems = await QuotationItem.findOne({ quotationId: id });

    // 3. Determine next version number (safe)
    const latestVersion = await QuotationVersion.findOne(
      { quotationId: id },
      { version: 1 },
      { sort: { version: -1 } } // This is now correct!
    )
      .lean()
      .exec(); // Optional but good practice

    let newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // 4. SAVE VERSION — WITH AUTOMATIC CONFLICT RESOLUTION
    const saveVersion = async (attempt = 1) => {
      try {
        await QuotationVersion.create({
          quotationId: id,
          version: newVersionNumber,
          quotationData: currentQuotation.toJSON(),
          quotationItems: currentMongoItems?.items || [],
          updatedBy: req.user?.userId || "unknown",
          updatedAt: new Date(),
        });
        console.log(`Version ${newVersionNumber} saved successfully`);
        return true;
      } catch (err) {
        if (err.code === 11000 && attempt <= 10) {
          console.warn(
            `Version conflict on ${newVersionNumber}, retrying with ${
              newVersionNumber + 1
            }...`
          );
          newVersionNumber += 1; // increment globally
          return await saveVersion(attempt + 1);
        } else {
          console.error("Failed to save version after retries:", err.message);
          return false; // non-blocking
        }
      }
    };

    await saveVersion(); // fire and forget (safe)

    // 5. Validate products
    const products = Array.isArray(incomingProducts) ? incomingProducts : [];
    if (products.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }

    // 6. Build product name/image map
    const productIds = [
      ...new Set(products.map((p) => p.productId || p.id).filter(Boolean)),
    ];
    const productMap = {};

    if (productIds.length > 0) {
      const dbProducts = await Product.findAll({
        where: { productId: productIds },
        attributes: ["productId", "name", "images"],
        transaction: t,
      });

      dbProducts.forEach((p) => {
        let imageUrl = null;
        if (p.images) {
          try {
            const imgs = JSON.parse(p.images);
            if (Array.isArray(imgs) && imgs.length > 0) imageUrl = imgs[0];
          } catch {}
        }
        productMap[p.productId] = {
          name: p.name?.trim() || "Unknown Product",
          imageUrl,
        };
      });
    }

    // 7. Server-side total calculation (source of truth)
    const totals = calculateTotals(
      products,
      Number(extraDiscount),
      extraDiscountType,
      Number(shippingAmount),
      Number(gst)
    );

    const finalAmount = parseFloat(
      (totals.finalAmount + Number(roundOff || 0)).toFixed(2)
    );

    // 8. Update PostgreSQL record
    await Quotation.update(
      {
        ...quotationData,
        products,
        extraDiscount: Number(extraDiscount) || null,
        extraDiscountType,
        discountAmount:
          totals.extraDiscountAmount > 0 ? totals.extraDiscountAmount : null,
        shippingAmount: Number(shippingAmount) || null,
        gst: Number(gst) || null,
        gstAmount: totals.gstAmount > 0 ? totals.gstAmount : null,
        roundOff: Number(roundOff) || 0,
        finalAmount,
        followupDates: followupDates.length > 0 ? followupDates : null,
      },
      { where: { quotationId: id }, transaction: t }
    );

    // 9. Update MongoDB items
    const mongoItems = products.map((p) => {
      const fallback = productMap[p.productId] || {};
      const total = p.total ? parseFloat(p.total) : calculateLineTotal(p);

      return {
        productId: p.productId || p.id,
        name: p.name || fallback.name || "Unknown Product",
        imageUrl: p.imageUrl || fallback.imageUrl || null,
        quantity: Number(p.quantity) || 1,
        price: Number(p.price) || 0,
        discount: Number(p.discount) || 0,
        discountType: p.discountType || "percent",
        tax: Number(p.tax) || 0,
        total: parseFloat(total.toFixed(2)),
      };
    });

    if (mongoItems.length > 0) {
      await QuotationItem.updateOne(
        { quotationId: id },
        { $set: { items: mongoItems } },
        { upsert: true }
      );
    } else {
      await QuotationItem.deleteOne({ quotationId: id });
    }

    await t.commit();

    // Optional notification
    // await sendNotification({ ... });

    return res.status(200).json({
      message: "Quotation updated successfully",
      version: newVersionNumber,
      finalAmount,
    });
  } catch (error) {
    await t.rollback();
    console.error("updateQuotation failed:", error);
    return res.status(500).json({
      error: "Failed to update quotation",
      details: error.message,
    });
  }
};
// EXPORT TO EXCEL – includes shippingAmount
exports.exportQuotation = async (req, res) => {
  try {
    const { id, version } = req.params;

    let quotation,
      quotationItems = [];

    if (version) {
      const versionData = await QuotationVersion.findOne({
        quotationId: id,
        version: Number(version),
      });
      if (!versionData)
        return res.status(404).json({ message: "Version not found" });
      quotation = versionData.quotationData;
      quotationItems = versionData.quotationItems || [];
    } else {
      quotation = await Quotation.findByPk(id);
      if (!quotation)
        return res.status(404).json({ message: "Quotation not found" });
      const items = await QuotationItem.findOne({ quotationId: id });
      quotationItems = items ? items.items : [];
    }

    const {
      subTotal,
      totalItemDiscount,
      totalTax,
      extraDiscountAmount,
      gstAmount,
    } = calculateTotals(
      quotationItems.map((i) => ({
        sellingPrice: i.rate || i.mrp || 0,
        quantity: i.quantity || i.qty || 1,
        discount: i.discount || 0,
        tax: i.tax || 0,
      })),
      quotation.extraDiscount || 0,
      quotation.extraDiscountType,
      quotation.shippingAmount || 0,
      quotation.gst || 0
    );

    const finalTotal =
      subTotal +
      totalTax +
      (quotation.shippingAmount || 0) +
      gstAmount -
      totalItemDiscount -
      extraDiscountAmount +
      (quotation.roundOff || 0);
    const sheetData = [
      ["Estimate / Quotation", "", "", "", "GROHE / AMERICAN STANDARD"],
      [""],
      [
        "M/s",
        quotation.companyName || quotation.customerId || "CHHABRA MARBLE",
        "",
        "Date",
        quotation.quotation_date
          ? new Date(quotation.quotation_date).toLocaleDateString()
          : new Date().toLocaleDateString(),
      ],
      ["Address", quotation.shipTo || "456, Park Avenue, New York, USA"],
      [""],
      [
        "S.No",
        "Product Image",
        "Product Name",
        "Product Code",
        "MRP",
        "Discount",
        "Rate",
        "Unit",
        "Total",
      ],
    ];

    quotationItems.forEach((p, idx) => {
      sheetData.push([
        idx + 1,
        p.imageUrl || "N/A",
        p.name || "N/A",
        p.product_code || "N/A",
        Number(p.mrp) || 0,
        p.discount
          ? p.discountType === "percent"
            ? `${Number(p.discount)}%`
            : `₹${Number(p.discount)}`
          : 0,
        Number(p.rate) || Number(p.total) || 0,
        p.quantity || p.qty || 1,
        Number(p.total) || 0,
      ]);
    });

    sheetData.push([]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Subtotal",
      "",
      subTotal.toFixed(2),
    ]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Item Discount",
      "",
      totalItemDiscount.toFixed(2),
    ]);
    if (extraDiscountAmount) {
      sheetData.push([
        "",
        "",
        "",
        "",
        "",
        "",
        `Extra Discount ${
          quotation.extraDiscountType === "percent"
            ? `(${quotation.extraDiscount}%)`
            : ""
        }`,
        "",
        extraDiscountAmount.toFixed(2),
      ]);
    }
    sheetData.push(["", "", "", "", "", "", "Tax", "", totalTax.toFixed(2)]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Shipping",
      "",
      (quotation.shippingAmount || 0).toFixed(2),
    ]);
    sheetData.push(["", "", "", "", "", "", "GST", "", gstAmount.toFixed(2)]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Round-off",
      "",
      (quotation.roundOff || 0).toFixed(2),
    ]);
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "TOTAL",
      "",
      finalTotal.toFixed(2),
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quotation");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=quotation_${id}${
        version ? `_v${version}` : ""
      }.xlsx`
    );
    res.send(buffer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to export quotation", error: error.message });
  }
};

// CLONE QUOTATION – include shippingAmount
exports.cloneQuotation = async (req, res) => {
  try {
    const original = await Quotation.findByPk(req.params.id);
    if (!original)
      return res.status(404).json({ message: "Quotation not found" });

    const originalItems = await QuotationItem.findOne({
      quotationId: req.params.id,
    });
    const newId = uuidv4();

    const cloned = await Quotation.create({
      quotationId: newId,
      document_title: `${original.document_title} (Copy)`,
      quotation_date: new Date(),
      due_date: original.due_date,
      reference_number: original.reference_number,
      customerId: original.customerId,
      createdBy: req.user.userId,
      shipTo: original.shipTo,
      extraDiscount: original.extraDiscount,
      extraDiscountType: original.extraDiscountType,
      discountAmount: original.discountAmount,
      shippingAmount: original.shippingAmount,
      gst: original.gst,
      products: original.products,
      roundOff: original.roundOff,
      finalAmount: original.finalAmount,
      signature_name: original.signature_name,
      signature_image: original.signature_image,
      followupDates: original.followupDates,
    });

    if (originalItems && Array.isArray(originalItems.items)) {
      await QuotationItem.create({
        quotationId: newId,
        items: originalItems.items.map((i) => ({ ...i })),
      });
    }

    await sendNotification({
      userId: req.user.userId,
      title: "Quotation Cloned",
      message: `Quotation "${original.document_title}" cloned as "${cloned.document_title}".`,
    });

    res.status(201).json({
      message: "Quotation cloned successfully",
      clonedQuotation: cloned,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to clone quotation", error: error.message });
  }
};

// RESTORE VERSION – already covered by QuotationVersion data
exports.restoreQuotationVersion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, version } = req.params;

    const versionData = await QuotationVersion.findOne({
      quotationId: id,
      version: Number(version),
    });
    if (!versionData) {
      await t.rollback();
      return res.status(404).json({ message: "Version not found" });
    }

    await Quotation.update(
      { ...versionData.quotationData },
      { where: { quotationId: id }, transaction: t }
    );

    if (versionData.quotationItems?.length > 0) {
      await QuotationItem.updateOne(
        { quotationId: id },
        { $set: { items: versionData.quotationItems } },
        { upsert: true }
      );
    } else {
      await QuotationItem.deleteOne({ quotationId: id });
    }

    await t.commit();

    await sendNotification({
      userId: req.user.userId,
      title: "Quotation Restored",
      message: `Quotation "${id}" restored to version ${version}.`,
    });

    res
      .status(200)
      .json({ message: `Quotation restored to version ${version}` });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({ error: "Failed to restore quotation", details: error.message });
  }
};

/* ------------------------------------------------------------------ */
/* The rest of your controller (getById, getAll, delete, getVersions) */
/* remains unchanged – they already return the new fields via the model */
/* ------------------------------------------------------------------ */
// Get a single quotation by ID with items
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    const items = await QuotationItem.findOne({ quotationId: req.params.id });

    res.status(200).json({
      ...quotation.toJSON(),
      items: items?.items || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all quotations with their items
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll();
    const quotationIds = quotations.map((q) => q.quotationId);
    const items = await QuotationItem.find({
      quotationId: { $in: quotationIds },
    });

    // Merge items into quotations
    const response = quotations.map((q) => ({
      ...q.toJSON(),
      items: items.find((i) => i.quotationId === q.quotationId)?.items || [],
    }));

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getQuotationVersions = async (req, res) => {
  try {
    const { id } = req.params;

    const versions = await QuotationVersion.find({ quotationId: id })
      .sort({ version: -1 }) // ← NEWEST FIRST (critical for UX)
      .lean(); // ← Important: removes Mongoose wrappers

    if (!versions || versions.length === 0) {
      return res.status(404).json({ message: "No versions found" });
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

    res.status(200).json(cleanedVersions);
  } catch (error) {
    console.error("getQuotationVersions error:", error);
    res.status(500).json({
      error: "Failed to retrieve versions",
      details: error.message,
    });
  }
};
