const { v4: uuidv4 } = require("uuid");
const Quotation = require("../models/quotation");
const QuotationItem = require("../models/quotationItem");
const XLSX = require("xlsx");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");
const fs = require("fs");
const path = require("path");
const QuotationVersion = require("../models/quotationVersion");

// Create a new quotation
exports.createQuotation = async (req, res) => {
  try {
    let { products, items, followupDates, discountAmount, ...quotationData } =
      req.body;

    const quotationItems = items || products || [];

    const formattedItems = quotationItems.map((item) => ({
      ...item,
      productId: item.productId || null,
      quantity: Number(item.quantity) || 1,
      discount: Number(item.discount) || 0, // Optional per item
      tax: Number(item.tax) || 0,
      total: Number(item.total) || 0,
    }));

    quotationData.products = JSON.stringify(formattedItems);
    quotationData.discountAmount = discountAmount ?? null;

    quotationData.followupDates = followupDates
      ? JSON.stringify(followupDates)
      : null;

    const quotation = await Quotation.create({
      ...quotationData,
      quotationId: uuidv4(),
    });

    if (formattedItems.length > 0) {
      await QuotationItem.create({
        quotationId: quotation.quotationId,
        items: formattedItems,
      });
    }

    await sendNotification({
      userId: req.user.userId,
      title: "New Quotation Created",
      message: `Quotation "${
        quotation.document_title || quotation.quotationId
      }" was created successfully.`,
    });

    res.status(201).json({
      quotation,
      message: "Quotation created successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a quotation and its items
exports.updateQuotation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items, products, followupDates, discountAmount, ...quotationData } =
      req.body;

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

    const quotationItems = items || products || [];
    const formattedItems = quotationItems.map((item) => ({
      productId: item.productId || null,
      quantity: Number(item.quantity) || 1,
      discount: Number(item.discount) || 0,
      tax: Number(item.tax) || 0,
      total: Number(item.total) || 0,
    }));

    quotationData.products =
      formattedItems.length > 0 ? JSON.stringify(formattedItems) : null;
    quotationData.discountAmount = discountAmount ?? null;

    if (followupDates !== undefined)
      quotationData.followupDates = JSON.stringify(followupDates);

    const updated = await Quotation.update(quotationData, {
      where: { quotationId: id },
      transaction: t,
    });
    if (!updated[0]) {
      await t.rollback();
      return res.status(404).json({ message: "Quotation not found" });
    }

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
      message: `Quotation "${id}" was updated successfully (Version ${newVersionNumber}).`,
    });

    res.status(200).json({ message: "Quotation updated successfully" });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({ error: "Failed to update quotation", details: error.message });
  }
};

// Export quotation to Excel
exports.exportQuotation = async (req, res) => {
  try {
    const { id, version } = req.params;

    let quotation;
    let quotationItems = [];

    if (version) {
      // Fetch specific version from QuotationVersion
      const versionData = await QuotationVersion.findOne({
        quotationId: id,
        version: Number(version),
      });
      if (!versionData) {
        return res.status(404).json({ message: "Quotation version not found" });
      }
      quotation = versionData.quotationData;
      quotationItems = versionData.quotationItems || [];
    } else {
      // Fetch current quotation
      quotation = await Quotation.findByPk(id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      const items = await QuotationItem.findOne({ quotationId: id });
      quotationItems = items ? items.items : [];
    }

    // Prepare sheet data
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

    let index = 0;
    quotationItems.forEach((product) => {
      sheetData.push([
        ++index,
        product.imageUrl || "N/A",
        product.name || "N/A",
        product.product_code || "N/A",
        Number(product.mrp) || Number(product.total) || 0,
        product.discount
          ? product.discountType === "percent"
            ? `${Number(product.discount)}%`
            : Number(product.discount)
          : 0,
        Number(product.rate) || Number(product.total) || 0,
        product.quantity || product.qty || 1,
        Number(product.total) || 0,
      ]);
    });

    const subtotal = quotationItems.reduce(
      (sum, product) => sum + Number(product.total || 0),
      0
    );

    // Apply discountAmount (could be fixed or % — frontend decides)
    let discountValue = quotation.discountAmount ?? 0;
    const totalAfterDiscount = subtotal - discountValue;

    const finalTotal = totalAfterDiscount; // GST handled in frontend if needed

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
      subtotal.toFixed(2),
    ]);
    if (quotation.include_gst && quotation.gst_value) {
      sheetData.push([
        "",
        "",
        "",
        "",
        "",
        "",
        `GST (${quotation.gst_value}%)`,
        "",
        gstAmount.toFixed(2),
      ]);
    }
    sheetData.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "Total",
      "",
      finalTotal.toFixed(2),
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    const columnWidths = [
      { wch: 5 },
      { wch: 20 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Quotation");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=quotation_${id}${
        version ? `_version_${version}` : ""
      }.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to export quotation", error: error.message });
  }
};

// Clone quotation
exports.cloneQuotation = async (req, res) => {
  try {
    const originalQuotation = await Quotation.findByPk(req.params.id);
    if (!originalQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const originalItems = await QuotationItem.findOne({
      quotationId: req.params.id,
    });
    const newQuotationId = uuidv4();
    const clonedQuotation = await Quotation.create({
      quotationId: newQuotationId,
      document_title: `${originalQuotation.document_title} (Copy)`,
      quotation_date: new Date(),
      due_date: originalQuotation.due_date,
      reference_number: originalQuotation.reference_number,
      customerId: originalQuotation.customerId,
      createdBy: req.user.userId,
      shipTo: originalQuotation.shipTo,
      discountAmount: originalQuotation.discountAmount,
      products: originalQuotation.products,
      roundOff: originalQuotation.roundOff,
      finalAmount: originalQuotation.finalAmount,
      signature_name: originalQuotation.signature_name,
      signature_image: originalQuotation.signature_image,
      followupDates: originalQuotation.followupDates,
    });

    if (originalItems && Array.isArray(originalItems.items)) {
      const clonedItems = originalItems.items.map((item) => ({ ...item }));
      await QuotationItem.create({
        quotationId: newQuotationId,
        items: clonedItems,
      });
    }

    await sendNotification({
      userId: req.user.userId,
      title: "Quotation Cloned",
      message: `Quotation "${originalQuotation.document_title}" has been cloned successfully as "${clonedQuotation.document_title}".`,
    });

    res
      .status(201)
      .json({ message: "Quotation cloned successfully", clonedQuotation });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to clone quotation", error: error.message });
  }
};

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
exports.restoreQuotationVersion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, version } = req.params;

    // Fetch the specific version
    const versionData = await QuotationVersion.findOne({
      quotationId: id,
      version: Number(version),
    });

    if (!versionData) {
      await t.rollback();
      return res.status(404).json({ message: "Version not found" });
    }

    // Update Quotation in Sequelize
    await Quotation.update(
      { ...versionData.quotationData },
      { where: { quotationId: id }, transaction: t }
    );

    // Update QuotationItem in MongoDB
    if (versionData.quotationItems.length > 0) {
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
      message: `Quotation "${id}" has been restored to version ${version}.`,
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
