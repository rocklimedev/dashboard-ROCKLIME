const { v4: uuidv4 } = require("uuid");
const Quotation = require("../models/quotation");
const QuotationItem = require("../models/quotationItem");
const XLSX = require("xlsx");
const sequelize = require("../config/database");
const { sendNotification } = require("./notificationController");
const fs = require("fs");
const path = require("path");

// Create a new quotation
exports.createQuotation = async (req, res) => {
  try {
    let { products, items, include_gst, gst_value, ...quotationData } =
      req.body;

    const quotationItems = items || products || [];

    const formattedItems = quotationItems.map((item) => ({
      ...item,
      productId: item.productId || null,
      quantity: Number(item.quantity) || 1,
      discount: Number(item.discount) || 0,
      tax: Number(item.tax) || 0,
      total: Number(item.total) || 0,
    }));

    quotationData.products = JSON.stringify(formattedItems);

    // Include GST fields
    quotationData.include_gst = include_gst ?? null;
    quotationData.gst_value = gst_value ?? null;

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
    const { items, products, include_gst, gst_value, ...quotationData } =
      req.body;

    if (!id) {
      await t.rollback();
      return res.status(400).json({ message: "Quotation ID is required" });
    }

    const quotationItems = items || products || [];
    const formattedItems = quotationItems.map((item) => ({
      productId: item.productId || null,
      quantity: Number(item.quantity) || 1,
      discount: Number(item.discount) || 0,
      tax: Number(item.tax) || 0,
      total: Number(item.total) || 0,
    }));

    if (quotationItems.length > 0) {
      quotationData.products = JSON.stringify(formattedItems);
    } else {
      quotationData.products = null;
    }

    // Update GST fields if provided
    if (include_gst !== undefined) quotationData.include_gst = include_gst;
    if (gst_value !== undefined) quotationData.gst_value = gst_value;

    const check = await Quotation.findOne({
      where: { quotationId: id },
      transaction: t,
    });
    if (!check) {
      await t.rollback();
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (Object.keys(quotationData).length > 0) {
      const updated = await Quotation.update(quotationData, {
        where: { quotationId: id },
        transaction: t,
      });
      if (!updated[0]) {
        await t.rollback();
        return res.status(404).json({ message: "Quotation not found" });
      }
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
      message: `Quotation "${id}" was updated successfully.`,
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
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    const quotationItems = await QuotationItem.findAll({
      where: { quotationId: req.params.id },
    });

    const sheetData = [
      ["Estimate / Quotation", "", "", "", "GROHE / AMERICAN STANDARD"],
      [""],
      [
        "M/s",
        quotation.companyName || "CHHABRA MARBLE",
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
    quotationItems.forEach((item) => {
      const products =
        item.items && Array.isArray(item.items) ? item.items : [];
      products.forEach((product) => {
        sheetData.push([
          ++index,
          product.imageUrl || "N/A",
          product.productName || product.name || "N/A",
          product.productCode || "N/A",
          Number(product.mrp) || 0,
          product.discount
            ? product.discountType === "percent"
              ? Number(product.discount) / 100
              : Number(product.discount)
            : 0,
          Number(product.rate) || Number(product.mrp) || 0,
          product.unit || product.qty || 0,
          Number(product.total) || 0,
        ]);
      });
    });

    const subtotal = quotationItems.reduce((sum, item) => {
      const products =
        item.items && Array.isArray(item.items) ? item.items : [];
      return sum + products.reduce((s, p) => s + Number(p.total || 0), 0);
    }, 0);

    const gstAmount =
      quotation.include_gst && quotation.gst_value
        ? (subtotal * Number(quotation.gst_value)) / 100
        : 0;
    const finalTotal = subtotal + gstAmount;

    sheetData.push([]);
    sheetData.push(["", "", "", "", "", "", "Subtotal", "", subtotal]);
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
        gstAmount,
      ]);
    }
    sheetData.push(["", "", "", "", "", "", "Total", "", finalTotal]);

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
      `attachment; filename=quotation_${req.params.id}.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to export quotation", error: error.message });
  }
};

// Clone quotation
// Clone a quotation
exports.cloneQuotation = async (req, res) => {
  try {
    // Fetch the original quotation
    const originalQuotation = await Quotation.findByPk(req.params.id);
    if (!originalQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Fetch original quotation items
    const originalItems = await QuotationItem.findOne({
      quotationId: req.params.id,
    });

    // Generate a new unique ID for the cloned quotation
    const newQuotationId = uuidv4();

    // Create cloned quotation
    const clonedQuotation = await Quotation.create({
      quotationId: newQuotationId,
      document_title: `${originalQuotation.document_title} (Copy)`,
      quotation_date: new Date(), // New date for the cloned quotation
      due_date: originalQuotation.due_date,
      reference_number: originalQuotation.reference_number,
      customerId: originalQuotation.customerId,
      createdBy: req.user.userId, // Current user is creator
      shipTo: originalQuotation.shipTo,
      include_gst: originalQuotation.include_gst,
      gst_value: originalQuotation.gst_value,
      products: originalQuotation.products,
      discountType: originalQuotation.discountType,
      roundOff: originalQuotation.roundOff,
      finalAmount: originalQuotation.finalAmount,
      signature_name: originalQuotation.signature_name,
      signature_image: originalQuotation.signature_image,
    });

    // Clone quotation items
    if (originalItems && Array.isArray(originalItems.items)) {
      const clonedItems = originalItems.items.map((item) => ({ ...item }));
      await QuotationItem.create({
        quotationId: newQuotationId,
        items: clonedItems,
      });
    }

    // Send notification
    await sendNotification({
      userId: req.user.userId,
      title: "Quotation Cloned",
      message: `Quotation "${originalQuotation.document_title}" has been cloned successfully as "${clonedQuotation.document_title}".`,
    });

    res.status(201).json({
      message: "Quotation cloned successfully",
      clonedQuotation,
    });
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
