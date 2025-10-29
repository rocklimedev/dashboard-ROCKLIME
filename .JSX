// controllers/quotationController.js
const { v4: uuidv4 } = require("uuid");
const Quotation = require("../models/quotation");
const QuotationItem = require("../models/quotationItem");
const QuotationVersion = require("../models/quotationVersion");
const XLSX = require("xlsx");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");

// ---------------------------------------------------------------------
// Helper – calculate totals (used by create & update)
const calculateTotals = (
  products,
  extraDiscount = 0,
  extraDiscountType = null
) => {
  const subTotal = products.reduce(
    (sum, p) => sum + p.sellingPrice * p.quantity,
    0
  );
  const totalItemDiscount = products.reduce(
    (sum, p) => sum + (p.discount || 0),
    0
  );
  const totalTax = products.reduce((sum, p) => {
    const itemSub = p.sellingPrice * p.quantity;
    return sum + ((itemSub - (p.discount || 0)) * (p.tax || 0)) / 100;
  }, 0);

  // ----- extra global discount -----
  let extraDiscountAmount = 0;
  if (extraDiscount > 0 && extraDiscountType) {
    extraDiscountAmount =
      extraDiscountType === "percent"
        ? (subTotal * extraDiscount) / 100
        : extraDiscount;
  }

  const finalAmount =
    subTotal + totalTax - totalItemDiscount - extraDiscountAmount;

  return {
    subTotal: parseFloat(subTotal.toFixed(2)),
    totalItemDiscount: parseFloat(totalItemDiscount.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    extraDiscountAmount: parseFloat(extraDiscountAmount.toFixed(2)),
    finalAmount: parseFloat(finalAmount.toFixed(2)),
  };
};
// ---------------------------------------------------------------------

// CREATE QUOTATION
exports.createQuotation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      products,
      extraDiscount = 0,
      extraDiscountType = null,
      followupDates,
      ...quotationData
    } = req.body;

    // ---- validation ----
    if (!Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one product is required" });
    }

    const {
      subTotal,
      totalItemDiscount,
      totalTax,
      extraDiscountAmount,
      finalAmount,
    } = calculateTotals(products, extraDiscount, extraDiscountType);

    // ---- round-off (optional) ----
    const roundOff = quotationData.roundOff
      ? parseFloat(quotationData.roundOff)
      : 0;
    const finalAmountWithRound = parseFloat(
      (finalAmount + roundOff).toFixed(2)
    );

    // ---- DB insert ----
    const quotation = await Quotation.create(
      {
        ...quotationData,
        quotationId: quotationData.quotationId || uuidv4(),
        products: JSON.stringify(products),
        extraDiscount: extraDiscount > 0 ? extraDiscount : null,
        extraDiscountType: extraDiscountType,
        discountAmount: extraDiscountAmount > 0 ? extraDiscountAmount : null, // legacy field
        finalAmount: finalAmountWithRound,
        followupDates: followupDates ? JSON.stringify(followupDates) : null,
      },
      { transaction: t }
    );

    // ---- items (Mongo) ----
    if (products.length > 0) {
      await QuotationItem.create(
        {
          quotationId: quotation.quotationId,
          items: products.map((p) => ({
            productId: p.productId,
            quantity: p.quantity,
            discount: p.discount || 0,
            tax: p.tax || 0,
            total: p.total || 0,
          })),
        },
        { transaction: t }
      );
    }

    await t.commit();

    await sendNotification({
      userId: req.user.userId,
      title: "New Quotation Created",
      message: `Quotation "${quotation.document_title}" created successfully.`,
    });

    res.status(201).json({
      quotation,
      calculated: {
        subTotal,
        totalItemDiscount,
        totalTax,
        extraDiscountAmount,
        finalAmount: finalAmountWithRound,
      },
      message: "Quotation created successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Quotation creation error:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE QUOTATION
exports.updateQuotation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      items,
      products: incomingProducts,
      followupDates,
      extraDiscount = 0,
      extraDiscountType = null,
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

    // ---- version snapshot ----
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

    // ---- product handling ----
    const products = incomingProducts || items || [];
    const formattedItems = products.map((item) => ({
      productId: item.productId || null,
      quantity: Number(item.quantity) || 1,
      discount: Number(item.discount) || 0,
      tax: Number(item.tax) || 0,
      total: Number(item.total) || 0,
    }));

    const { extraDiscountAmount, finalAmount } = calculateTotals(
      products,
      extraDiscount,
      extraDiscountType
    );

    const roundOff = quotationData.roundOff
      ? parseFloat(quotationData.roundOff)
      : 0;
    const finalAmountWithRound = parseFloat(
      (finalAmount + roundOff).toFixed(2)
    );

    // ---- prepare update payload ----
    const updatePayload = {
      ...quotationData,
      products:
        formattedItems.length > 0 ? JSON.stringify(formattedItems) : null,
      extraDiscount: extraDiscount > 0 ? extraDiscount : null,
      extraDiscountType,
      discountAmount: extraDiscountAmount > 0 ? extraDiscountAmount : null,
      finalAmount: finalAmountWithRound,
    };
    if (followupDates !== undefined)
      updatePayload.followupDates = JSON.stringify(followupDates);

    await Quotation.update(updatePayload, {
      where: { quotationId: id },
      transaction: t,
    });

    // ---- items (Mongo) ----
    if (formattedItems.length > 0) {
      await QuotationItem.updateOne(
        { quotationId: id },
        { $set: { items: formattedItems } },
        { upsert: true }
      );
    } else {
      await QuotationItem.deleteOne({ quotationId: id });
    }

    await t.commit();

    await sendNotification({
      userId: req.user.userId,
      title: "Quotation Updated",
      message: `Quotation "${id}" was updated (Version ${newVersionNumber}).`,
    });

    res.status(200).json({ message: "Quotation updated successfully" });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({ error: "Failed to update quotation", details: error.message });
  }
};

// EXPORT TO EXCEL (now shows extra discount)
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

    // ---- recalc totals for display (same logic as create/update) ----
    const { subTotal, totalItemDiscount, totalTax, extraDiscountAmount } =
      calculateTotals(
        quotationItems.map((i) => ({
          sellingPrice: i.rate || i.mrp || 0,
          quantity: i.quantity || i.qty || 1,
          discount: i.discount || 0,
          tax: i.tax || 0,
        })),
        quotation.extraDiscount || 0,
        quotation.extraDiscountType
      );

    const finalTotal =
      subTotal +
      totalTax -
      totalItemDiscount -
      extraDiscountAmount +
      (quotation.roundOff || 0);

    // ---- sheet ----
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

// CLONE QUOTATION
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

    res
      .status(201)
      .json({
        message: "Quotation cloned successfully",
        clonedQuotation: cloned,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to clone quotation", error: error.message });
  }
};

// RESTORE VERSION (now restores extraDiscount fields)
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
