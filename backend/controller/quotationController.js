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
  // 1. SubTotal (after item discount)
  const subTotal = products.reduce((sum, p) => {
    const lineTotal = p.total ?? (p.price || 0) * (p.quantity || 1);
    return sum + lineTotal;
  }, 0);

  // 2. Total Item Discount
  const totalItemDiscount = products.reduce((sum, p) => {
    const lineTotal = p.total ?? (p.price || 0) * (p.quantity || 1);
    const discount = p.discount || 0;
    const type = p.discountType || "percent";
    const discAmt =
      type === "percent" ? (lineTotal * discount) / 100 : discount;
    return sum + discAmt;
  }, 0);

  // 3. Item Tax (after item discount)
  const itemTax = products.reduce((sum, p) => {
    const lineTotal = p.total ?? (p.price || 0) * (p.quantity || 1);
    const discAmt =
      (p.discountType || "percent") === "percent"
        ? (lineTotal * (p.discount || 0)) / 100
        : p.discount || 0;
    const taxable = lineTotal - discAmt;
    return sum + (taxable * (p.tax || 0)) / 100;
  }, 0);

  // 4. Extra Discount (after item tax + shipping)
  let extraDiscountAmount = 0;
  if (extraDiscount > 0) {
    const base = subTotal - totalItemDiscount + itemTax + (shippingAmount || 0);
    extraDiscountAmount =
      extraDiscountType === "percent"
        ? parseFloat(((base * extraDiscount) / 100).toFixed(2))
        : parseFloat(extraDiscount.toFixed(2));
  }

  // 5. Amount BEFORE GST (for round-off)
  const amountBeforeGstRaw =
    subTotal -
    totalItemDiscount +
    itemTax +
    (shippingAmount || 0) -
    extraDiscountAmount;
  const amountBeforeGst = parseFloat(amountBeforeGstRaw.toFixed(2));

  let roundOff = 0; // ← local variable
  const rupees = Math.floor(amountBeforeGst);
  const paise = Math.round((amountBeforeGst - rupees) * 100);

  if (paise > 0 && paise <= 50) {
    roundOff = parseFloat((-(paise / 100)).toFixed(2));
  } else if (paise > 50) {
    roundOff = parseFloat(((100 - paise) / 100).toFixed(2));
  }
  const roundedAmount = parseFloat((amountBeforeGst + roundOff).toFixed(2));

  // 7. GST: FINAL STEP
  const gstAmount =
    gst > 0 ? parseFloat(((roundedAmount * gst) / 100).toFixed(2)) : 0;

  // 8. Final Amount
  const finalAmount = parseFloat((roundedAmount + gstAmount).toFixed(2));

  return {
    subTotal: parseFloat(subTotal.toFixed(2)),
    totalItemDiscount: parseFloat(totalItemDiscount.toFixed(2)),
    itemTax: parseFloat(itemTax.toFixed(2)),
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
// CREATE QUOTATION – ENRICHED WITH PRODUCT NAME & IMAGE
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
      roundOff: clientRoundOff = 0,
      finalAmount: clientFinalAmount,
      ...quotationData
    } = req.body;
    // ---------- 1. Safe JSON parsing ----------
    if (typeof products === "string") {
      try {
        products = JSON.parse(products);
      } catch {
        return res.status(400).json({ error: "Invalid products JSON" });
      }
    }

    if (typeof followupDates === "string") {
      try {
        followupDates = JSON.parse(followupDates);
      } catch {
        followupDates = [];
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

    // ---------- 3. Pull missing product details ----------
    const productIds = [
      ...new Set(products.map((p) => p.productId || p.id).filter(Boolean)),
    ];

    let dbProducts = [];
    if (productIds.length) {
      dbProducts = await Product.findAll({
        where: { productId: productIds },
        attributes: ["productId", "name", "images"], // only what we need
        transaction: t,
      });
    }

    // Build a fast lookup map: productId → { name, imageUrl }
    const productMap = dbProducts.reduce((map, p) => {
      let imageUrl = null;
      if (p.images) {
        try {
          const imgs = JSON.parse(p.images);
          if (Array.isArray(imgs) && imgs.length) imageUrl = imgs[0];
        } catch {}
      }
      map[p.productId] = {
        name: p.name?.trim() || "Unnamed product",
        imageUrl,
      };
      return map;
    }, {});

    // ---------- 4. Enrich client payload ----------
    const enrichedProducts = products.map((p) => {
      const id = p.productId || p.id;
      const db = productMap[id] || {};

      // client-provided fields win (price, discount, tax, total, qty)
      return {
        productId: id,
        name: p.name ?? db.name,
        imageUrl: p.imageUrl ?? db.imageUrl,
        quantity: Number(p.quantity) || 1,
        price: Number(p.price) || Number(p.sellingPrice) || 0,
        discount: Number(p.discount) || 0,
        discountType: p.discountType || "percent",
        tax: Number(p.tax) || 0,
        total: Number(p.total) ?? null, // keep null if not supplied → will be calculated
      };
    });

    // ---------- 5. Recalculate totals (same helper as before) ----------
    const {
      subTotal,
      totalItemDiscount,
      itemTax,
      extraDiscountAmount,
      amountBeforeGst,
      roundOff: serverRoundOff,
      roundedAmount,
      gstAmount: calcGst,
      finalAmount: serverFinalAmount,
    } = calculateTotals(
      enrichedProducts.map((p) => ({ ...p, total: null })), // force recalc
      extraDiscount,
      extraDiscountType,
      shippingAmount,
      gst
      // ← NO clientRoundOff
    );

    const clientFinal = parseFloat(clientFinalAmount);

    if (Math.abs(clientFinal - serverFinalAmount) > 0.01) {
      return res.status(400).json({
        error: "Final amount mismatch",
        expected: serverFinalAmount,
        received: clientFinal,
        debug: {
          amountBeforeGst,
          roundOff: serverRoundOff,
          roundedAmount,
          gstAmount: calcGst,
        },
      });
    }

    if (isNaN(clientFinal)) {
      return res.status(400).json({
        error: "finalAmount is required and must be a valid number",
      });
    }
    if (Math.abs(clientFinal - serverFinalAmount) > 0.01) {
      return res.status(400).json({
        error: "Final amount mismatch",
        expected: serverFinalAmount,
        received: clientFinal,
        debug: {
          subTotal,
          totalItemDiscount,
          itemTax,
          extraDiscountAmount,
          shippingAmount,
          gstAmount: calcGst,
          roundOff,
        },
      });
    }

    const finalAmount = clientFinal;

    // ---------- 7. Persist to PostgreSQL ----------
    const quotation = await Quotation.create(
      {
        ...quotationData,
        products: enrichedProducts,
        extraDiscount: Number(extraDiscount) || 0,
        extraDiscountType: extraDiscountType || "percent",
        discountAmount: Number(extraDiscountAmount) || 0,
        shippingAmount: Number(shippingAmount) || 0,
        gst: Number(gst) || 0,
        gstAmount: Number(calcGst) || 0,
        roundOff: Number(clientRoundOff) || 0,
        finalAmount: serverFinalAmount,
      },
      { transaction: t }
    );

    // ---------- 8. Persist to MongoDB (QuotationItem) ----------
    mongoItem = await QuotationItem.create({
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
        total: p.total ?? p.price * p.quantity, // fallback if total missing
      })),
    });

    // ---------- 9. Commit ----------
    await t.commit();

    // ---------- 10. Response ----------
    return res.status(201).json({
      message: "Quotation created successfully",
      quotation,
      calculated: {
        subTotal,
        totalItemDiscount,
        itemTax,
        extraDiscountAmount,
        shippingAmount,
        gstAmount: calcGst,
        finalAmount,
      },
    });
  } catch (error) {
    // ---------- Rollback ----------
    if (t) await t.rollback();
    if (mongoItem) {
      await QuotationItem.deleteOne({ _id: mongoItem._id }).catch(() => {});
    }

    console.error("Create Quotation Error:", error);
    return res.status(500).json({
      error: "Failed to create quotation",
      details: error.message,
    });
  }
};
// UPDATE QUOTATION
// UPDATE QUOTATION – FIXED
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

    const currentQuotation = await Quotation.findOne({
      where: { quotationId: id },
      transaction: t,
    });
    if (!currentQuotation) {
      await t.rollback();
      return res.status(404).json({ message: "Quotation not found" });
    }

    // === VERSIONING ===
    const currentItems = await QuotationItem.findOne({ quotationId: id });
    const latestVersion = await QuotationVersion.findOne({
      quotationId: id,
    }).sort({ version: -1 });
    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    await QuotationVersion.create({
      quotationId: id,
      version: newVersionNumber,
      quotationData: currentQuotation.toJSON(),
      quotationItems: currentItems ? currentItems.items : [],
      updatedBy: req.user.userId,
      updatedAt: new Date(),
    });

    // === PRODUCTS ===
    const products = Array.isArray(incomingProducts) ? incomingProducts : [];
    if (products.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }

    // === CALCULATE TOTALS ===
    const {
      extraDiscountAmount,
      gstAmount: calcGstAmount,
      finalAmount: amountBeforeRound,
    } = calculateTotals(
      products,
      extraDiscount,
      extraDiscountType,
      shippingAmount,
      gst
    );

    const finalAmount = parseFloat(
      (amountBeforeRound + Number(roundOff)).toFixed(2)
    );

    // === UPDATE PAYLOAD (NO STRINGIFY) ===
    const updatePayload = {
      ...quotationData,
      products, // ← **plain array**
      extraDiscount: extraDiscount > 0 ? extraDiscount : null,
      extraDiscountType,
      discountAmount: extraDiscountAmount > 0 ? extraDiscountAmount : null,
      shippingAmount: shippingAmount > 0 ? shippingAmount : null,
      gst: gst > 0 ? gst : null,
      gstAmount: calcGstAmount > 0 ? calcGstAmount : null,
      finalAmount,
      followupDates: followupDates.length ? followupDates : null, // ← **array or null**
      roundOff: Number(roundOff) || 0,
    };

    await Quotation.update(updatePayload, {
      where: { quotationId: id },
      transaction: t,
    });

    // === MONGO ITEMS ===
    const mongoItems = products.map((p) => ({
      productId: p.id || p.productId,
      quantity: p.quantity,
      discount: p.discount || 0,
      tax: p.tax || 0,
      total: p.total,
    }));

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

    await sendNotification({
      userId: req.user.userId,
      title: "Quotation Updated",
      message: `Quotation "${id}" updated (v${newVersionNumber})`,
    });

    res.status(200).json({
      message: "Quotation updated successfully",
      version: newVersionNumber,
    });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({ error: "Failed to update quotation", details: error.message });
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
            : Number(p.discount)
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
    const { id, version } = req.params;

    // Query to find versions for the given quotationId
    const query = { quotationId: id };

    // If a specific version is requested, add it to the query
    if (version) {
      query.version = Number(version);
    }

    const versions = await QuotationVersion.find(query).sort({ version: 1 }); // Sort by version number (ascending)

    if (!versions || versions.length === 0) {
      return res
        .status(404)
        .json({ message: "No versions found for this quotation" });
    }

    res.status(200).json(versions);
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve quotation versions",
      details: error.message,
    });
  }
};
