const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const QuotationItem = require("../models/quotationItem");
const QuotationVersion = require("../models/quotationVersion");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");
const { Product, Quotation } = require("../models");
const { Op } = require("sequelize");
function generateGroupId() {
  return "grp-" + uuidv4().slice(0, 8); // short & readable: grp-a1b2c3d4
}
// ---------------------------------------------------------------------
// Helper: Calculate totals (unchanged)
// ---------------------------------------------------------------------
const calculateTotals = (
  items = [],
  extraDiscount = 0,
  extraDiscountType = "percent",
  shippingAmount = 0,
  gst = 0, // ← this is usually the output GST rate shown to customer
) => {
  // Only main (non-optional) items contribute to totals
  const mainItems = items.filter((item) => !item.isOptionFor);

  let subTotal = 0; // sum of (price × qty) before any discount
  let totalItemDiscount = 0;
  let taxableAmount = 0; // after item-level discount, before extra disc & shipping
  let itemTaxTotal = 0; // ← will stay 0 when prices are GST inclusive

  mainItems.forEach((p) => {
    const price = Number(p.price) || 0; // ← GST-inclusive price
    const qty = Number(p.quantity) || 1;
    const discount = Number(p.discount) || 0;
    const discountType = p.discountType || "percent";

    // We do NOT use p.tax here anymore for calculation
    // (because price already contains tax)

    const lineGross = price * qty;

    const discountAmount =
      discountType === "percent"
        ? lineGross * (discount / 100)
        : discount * qty; // absolute discount per unit × qty

    const lineAfterDiscount = lineGross - discountAmount;

    // ────────────────────────────────────────
    // Most important change:
    // itemTaxTotal += ...   →   comment out or set to 0
    // ────────────────────────────────────────
    // const taxRate = Number(p.tax) || 0;
    // const taxAmount = lineAfterDiscount * (taxRate / 100);
    // itemTaxTotal += taxAmount;

    // Instead:
    const taxAmount = 0; // ← explicit
    itemTaxTotal += taxAmount;

    subTotal += lineGross;
    totalItemDiscount += discountAmount;
    taxableAmount += lineAfterDiscount;
  });

  // Base for extra discount = discounted items + shipping
  // (GST already inside price, so no item tax to add)
  const baseForExtraDiscount = taxableAmount + Number(shippingAmount || 0);

  const extraDiscountAmount =
    extraDiscountType === "percent"
      ? (baseForExtraDiscount * Number(extraDiscount)) / 100
      : Number(extraDiscount);

  const amountBeforeGst = baseForExtraDiscount - extraDiscountAmount;

  // Your paise rounding logic (unchanged)
  const rupees = Math.floor(amountBeforeGst);
  const paise = Math.round((amountBeforeGst - rupees) * 100);
  let roundOff = 0;
  if (paise > 0 && paise <= 50) {
    roundOff = -paise / 100;
  } else if (paise > 50) {
    roundOff = (100 - paise) / 100;
  }

  const roundedAmount = amountBeforeGst + roundOff;

  // GST is usually **shown separately** even if price is inclusive
  // Most common approach in India (B2B + many B2C):
  const gstAmount = roundedAmount * (Number(gst || 0) / 100);

  // If you want to be very strict (price is inclusive → no extra GST):
  // const gstAmount = 0;

  const finalAmount = roundedAmount + gstAmount;

  // Optional items (display only)
  const optionalItems = items.filter((item) => !!item.isOptionFor);
  let optionalPotential = 0;
  optionalItems.forEach((p) => {
    optionalPotential += (Number(p.price) || 0) * (Number(p.quantity) || 1);
  });

  return {
    subTotal: Number(subTotal.toFixed(2)),
    totalItemDiscount: Number(totalItemDiscount.toFixed(2)),
    itemTax: Number(itemTaxTotal.toFixed(2)), // ← will be 0
    extraDiscountAmount: Number(extraDiscountAmount.toFixed(2)),
    shippingAmount: Number(shippingAmount || 0),
    amountBeforeGst: Number(amountBeforeGst.toFixed(2)),
    roundOff: Number(roundOff.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    finalAmount: Number(finalAmount.toFixed(2)),

    optionalItemsCount: optionalItems.length,
    optionalPotentialTotal: Number(optionalPotential.toFixed(2)),
  };
};
// ---------------------------------------------------------------------
// Helper: Generate next daily sequential reference_number (QUO + DDMMYY + seq)
// Safe inside transaction — retries on collision
// ---------------------------------------------------------------------
async function generateQuotationNumber(t) {
  const today = moment();
  const prefixDate = today.format("DDMMYY"); // "150126" (no leading zeros)
  const fullPrefix = `QUO${prefixDate}`; // "QUO150126" – always 9 chars
  const todayStart = today.startOf("day").toDate();
  const todayEnd = today.endOf("day").toDate();

  let attempt = 0;
  const MAX_ATTEMPTS = 15;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;

    // Find the highest existing number today
    const last = await Quotation.findOne({
      where: {
        reference_number: {
          [Op.like]: `${fullPrefix}%`,
        },
        createdAt: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
      attributes: ["reference_number"],
      order: [["reference_number", "DESC"]],
      limit: 1,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let nextSeq = 101; // your starting number

    if (last) {
      const seqStr = last.reference_number.slice(fullPrefix.length); // ← correct: after 9 chars
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed) && parsed >= 100) {
        // safety check
        nextSeq = parsed + 1;
      }
    }

    const candidate = `${fullPrefix}${nextSeq}`;

    // Collision check (should be extremely rare with lock + transaction)
    const exists = await Quotation.findOne({
      where: { reference_number: candidate },
      transaction: t,
    });

    if (!exists) {
      return candidate;
    }

    console.warn(
      `Collision detected: ${candidate} — retrying (${attempt}/${MAX_ATTEMPTS})`,
    );
  }

  throw new Error(
    `Could not generate unique quotation number after ${MAX_ATTEMPTS} attempts`,
  );
}
// ─────────────────────────────────────────────
// CREATE QUOTATION
// ─────────────────────────────────────────────
exports.createQuotation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let {
      products: incomingProducts,
      extraDiscount = 0,
      extraDiscountType = "percent",
      shippingAmount = 0,
      gst = 0,
      ...quotationData
    } = req.body;

    // Parse if string
    if (typeof incomingProducts === "string") {
      try {
        incomingProducts = JSON.parse(incomingProducts);
      } catch {
        return res.status(400).json({ error: "Invalid products JSON" });
      }
    }

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }
    if (!quotationData.customerId) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    // Fetch product details
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
            const imgs = JSON.parse(p.images);
            if (Array.isArray(imgs) && imgs.length) imageUrl = imgs[0];
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

    // Enrich products & assign groups
    const enrichedProducts = incomingProducts.map((p) => {
      const id = p.productId || p.id;
      const db = productMap[id] || {};

      const price = Number(p.price || 0);
      const qty = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || "percent";

      const isOption = !!p.isOptionFor;
      const groupId = p.groupId || (isOption ? null : generateGroupId());

      let lineTotalAfterDiscount =
        discountType === "percent"
          ? price * qty * (1 - discount / 100)
          : (price - discount) * qty;

      // Inside map()
      return {
        productId: id,
        name: p.name || db.name || "Unknown Product",
        imageUrl: p.imageUrl || db.imageUrl || null,
        productCode: p.productCode || db.productCode || null,
        companyCode: p.companyCode || db.companyCode || null,
        quantity: qty,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: 0, // ← force to 0
        total: Number(lineTotalAfterDiscount.toFixed(2)),
        isOptionFor: isOption ? p.isOptionFor : null,
        optionType: p.optionType || null,
        groupId: groupId || null,
      };
    });

    const totals = calculateTotals(
      enrichedProducts,
      Number(extraDiscount),
      extraDiscountType,
      Number(shippingAmount),
      Number(gst),
    );

    const reference_number = await generateQuotationNumber(t);

    const quotation = await Quotation.create(
      {
        ...quotationData,
        reference_number,
        products: enrichedProducts,
        extraDiscount: Number(extraDiscount) || 0,
        extraDiscountType: extraDiscountType || "percent",
        discountAmount: totals.extraDiscountAmount,
        shippingAmount: Number(shippingAmount) || 0,
        gst: Number(gst) || 0,
        gstAmount: totals.gstAmount,
        roundOff: totals.roundOff,
        finalAmount: totals.finalAmount,
      },
      { transaction: t },
    );

    // When saving to QuotationItem
    await QuotationItem.create({
      quotationId: quotation.quotationId,
      items: enrichedProducts.map((item) => ({
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        discountType: item.discountType,
        tax: item.tax,
        total: item.total,
        // These were missing!
        isOptionFor: item.isOptionFor || null,
        optionType: item.optionType || null,
        groupId: item.groupId || null,
        // optional: companyCode, productCode if you want them
      })),
    });

    await t.commit();

    return res.status(201).json({
      message: "Quotation created successfully",
      quotation: {
        ...quotation.toJSON(),
        finalAmount: totals.finalAmount,
      },
      calculated: totals,
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Quotation Error:", error);
    return res.status(500).json({
      error: "Failed to create quotation",
      details: error.message,
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

    // Save version (non-blocking on failure)
    const latestVersion = await QuotationVersion.findOne({
      quotationId: id,
    }).sort({ version: -1 });

    let newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    const currentMongoItems = await QuotationItem.findOne({ quotationId: id });

    try {
      await QuotationVersion.create({
        quotationId: id,
        version: newVersionNumber,
        quotationData: currentQuotation.toJSON(),
        quotationItems: currentMongoItems?.items || [],
        updatedBy: req.user?.userId || "unknown",
        updatedAt: new Date(),
      });
    } catch (verErr) {
      console.warn("Version save failed (non-critical):", verErr.message);
      // continue anyway
    }

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }

    // Fetch product details (same as create)
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
            const imgs = JSON.parse(p.images);
            if (Array.isArray(imgs) && imgs.length) imageUrl = imgs[0];
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

    // Enrich incoming products
    const enrichedProducts = incomingProducts.map((p) => {
      const id = p.productId || p.id;
      const db = productMap[id] || {};

      const price = Number(p.price || 0);
      const qty = Number(p.quantity) || 1;
      const discount = Number(p.discount || 0);
      const discountType = p.discountType || db.discountType || "percent";

      const isOption = !!p.isOptionFor;
      const groupId = p.groupId || (isOption ? null : generateGroupId());

      let total = p.total ? Number(p.total) : 0;
      if (!total) {
        total =
          discountType === "percent"
            ? price * qty * (1 - discount / 100)
            : (price - discount) * qty;
      }
      // Inside map()
      return {
        productId: id,
        name: p.name || db.name || "Unknown Product",
        imageUrl: p.imageUrl || db.imageUrl || null,
        productCode: p.productCode || db.productCode || null,
        companyCode: p.companyCode || db.companyCode || null,
        quantity: qty,
        price: Number(price.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        discountType,
        tax: 0, // ← force to 0
        total: Number(lineTotalAfterDiscount.toFixed(2)),
        isOptionFor: isOption ? p.isOptionFor : null,
        optionType: p.optionType || null,
        groupId: groupId || null,
      };
    });

    const totals = calculateTotals(
      enrichedProducts,
      Number(extraDiscount),
      extraDiscountType,
      Number(shippingAmount),
      Number(gst),
    );

    // Update main record
    await Quotation.update(
      {
        ...quotationData,
        products: enrichedProducts,
        extraDiscount: Number(extraDiscount) || 0,
        extraDiscountType,
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

    // Update MongoDB items
    if (enrichedProducts.length > 0) {
      await QuotationItem.updateOne(
        { quotationId: id },
        { $set: { items: enrichedProducts } },
        { upsert: true },
      );
    } else {
      await QuotationItem.deleteOne({ quotationId: id });
    }

    await t.commit();

    return res.status(200).json({
      message: "Quotation updated successfully",
      version: newVersionNumber,
      finalAmount: totals.finalAmount,
      calculated: totals,
    });
  } catch (error) {
    await t.rollback();
    console.error("Update Quotation Error:", error);
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
      quotation.gst || 0,
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=quotation_${id}${
        version ? `_v${version}` : ""
      }.xlsx`,
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

// RESTORE VERSION
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
    // ─────────────────────────────────────────────
    // Pagination parameters
    // ─────────────────────────────────────────────
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // ─────────────────────────────────────────────
    // Build dynamic WHERE clause
    // ─────────────────────────────────────────────
    const where = {};

    // Search filter (case-insensitive via LIKE on common collation)
    const search = req.query.search?.trim();
    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { document_title: { [Op.like]: searchTerm } },
        { reference_number: { [Op.like]: searchTerm } },
        // You can easily add more searchable fields here:
        // { customer_notes: { [Op.like]: searchTerm } },
      ];
    }

    // Customer filter
    if (req.query.customerId) {
      where.customerId = req.query.customerId;
    }

    // Status filter
    if (req.query.status) {
      where.status = req.query.status;
    }

    // Date range filter: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
    if (req.query.startDate || req.query.endDate) {
      where.quotation_date = {};
      if (req.query.startDate) {
        where.quotation_date[Op.gte] = req.query.startDate;
      }
      if (req.query.endDate) {
        where.quotation_date[Op.lte] = req.query.endDate;
      }
    }

    // ─────────────────────────────────────────────
    // Fetch paginated quotations (PostgreSQL → MySQL compatible)
    // ─────────────────────────────────────────────
    const { count: totalQuotations, rows: quotations } =
      await Quotation.findAndCountAll({
        where,
        offset,
        limit,
        order: [["quotation_date", "DESC"]], // or [['createdAt', 'DESC']]
        subQuery: false,
      });

    // If no results → early return with empty array
    if (quotations.length === 0) {
      return res.status(200).json({
        data: [],
        pagination: {
          total: totalQuotations,
          page,
          limit,
          totalPages: Math.ceil(totalQuotations / limit),
        },
      });
    }

    // ─────────────────────────────────────────────
    // Enrich with MongoDB items (your hybrid setup)
    // ─────────────────────────────────────────────
    const quotationIds = quotations.map((q) => q.quotationId);

    const mongoItems = await QuotationItem.find({
      quotationId: { $in: quotationIds },
    }).lean();

    // Build lookup: quotationId → items array
    const itemsMap = {};
    mongoItems.forEach((itemDoc) => {
      itemsMap[itemDoc.quotationId] = itemDoc.items || [];
    });

    // Merge items into SQL quotations
    const enrichedQuotations = quotations.map((q) => {
      const plain = q.toJSON();
      return {
        ...plain,
        items: itemsMap[plain.quotationId] || [],
      };
    });

    const totalPages = Math.ceil(totalQuotations / limit);

    // ─────────────────────────────────────────────
    // Final response
    // ─────────────────────────────────────────────
    return res.status(200).json({
      data: enrichedQuotations,
      pagination: {
        total: totalQuotations,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("getAllQuotations error:", error);
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
