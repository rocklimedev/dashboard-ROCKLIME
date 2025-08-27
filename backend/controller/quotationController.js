const { v4: uuidv4 } = require("uuid");
const Quotation = require("../models/quotation");
const QuotationItem = require("../models/quotationItem");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");

// Create a new quotation
exports.createQuotation = async (req, res) => {
  try {
    let { products, ...quotationData } = req.body;

    // Ensure discount values are numbers
    products = products.map((item) => ({
      ...item,
      discount: typeof item.discount === "string" ? 0.0 : item.discount, // Default if string
    }));

    const quotation = await Quotation.create({
      ...quotationData,
      products,
    });

    await QuotationItem.create({
      quotationId: quotation.quotationId,
      items: products,
    });

    res.status(201).json({
      quotation,
      message: "Quotation created successfully",
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

// Update a quotation and its items
// controllers/quotationController.js

exports.updateQuotation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items, ...quotationData } = req.body;

    // Validate input
    if (!id) {
      await t.rollback();
      return res.status(400).json({ message: "Quotation ID is required" });
    }
    if (Object.keys(quotationData).length === 0 && !items) {
      await t.rollback();
      return res.status(400).json({ message: "No data provided for update" });
    }
    if (items && !Array.isArray(items)) {
      await t.rollback();
      return res.status(400).json({ message: "Items must be an array" });
    }

    // Check if quotation exists
    const check = await Quotation.findOne({
      where: { quotationId: id },
      transaction: t,
    });
    if (!check) {
      await t.rollback();
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Stringify products if provided
    if (quotationData.products && typeof quotationData.products !== "string") {
      quotationData.products = JSON.stringify(quotationData.products);
    }

    // Update MySQL Quotation if quotationData is not empty
    let updated;
    if (Object.keys(quotationData).length > 0) {
      updated = await Quotation.update(quotationData, {
        where: { quotationId: id },
        transaction: t,
      });

      if (!updated[0]) {
        console.warn("No rows updated for ID:", id);
        await t.rollback();
        return res.status(404).json({ message: "Quotation not found" });
      }
    }

    // Update MongoDB Items
    if (items && items.length > 0) {
      await QuotationItem.updateOne(
        { quotationId: id },
        {
          $set: {
            items: items.map((item) => ({
              productId: item.productId || null,
              quantity: item.quantity,
              discount: item.discount,
              tax: item.tax,
              total: item.total,
            })),
          },
        },
        { upsert: true }
      );
    } else if (items) {
      await QuotationItem.deleteOne({ quotationId: id });
    }

    await t.commit();
    res.status(200).json({ message: "Quotation updated successfully" });
  } catch (error) {
    await t.rollback();

    res
      .status(500)
      .json({ error: "Failed to update quotation", details: error.message });
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
      return res
        .status(403)
        .json({
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

exports.exportQuotation = async (req, res) => {
  try {
    // Fetch quotation
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Fetch all quotation items
    const quotationItems = await QuotationItem.findAll({
      where: { quotationId: req.params.id },
    });

    // Prepare sheet data
    const sheetData = [
      ["Estimate / Quotation", "", "", "", "GROHE / AMERICAN STANDARD"],
      [""],
      [
        "M/s",
        quotation.companyName || "CHHABRA MARBLE",
        "",
        "Date",
        quotation.date
          ? new Date(quotation.date).toLocaleDateString()
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

    // Append product items
    let index = 0;
    quotationItems.forEach((item) => {
      // Assuming `items` is a JSON field containing an array of products
      const products =
        item.items && Array.isArray(item.items) ? item.items : [];
      products.forEach((product) => {
        sheetData.push([
          ++index, // S.No
          product.imageUrl || "N/A", // Product Image
          product.productName || product.name || "N/A", // Product Name
          product.productCode || "N/A", // Product Code
          Number(product.mrp) || 0, // MRP
          product.discount
            ? product.discountType === "percent"
              ? Number(product.discount) / 100
              : Number(product.discount)
            : 0, // Discount
          Number(product.rate) || Number(product.mrp) || 0, // Rate
          product.unit || product.qty || 0, // Unit
          Number(product.total) || 0, // Total
        ]);
      });
    });

    // Calculate totals
    const subtotal = quotationItems.reduce((sum, item) => {
      const products =
        item.items && Array.isArray(item.items) ? item.items : [];
      return (
        sum +
        products.reduce(
          (itemSum, product) => itemSum + Number(product.total || 0),
          0
        )
      );
    }, 0);
    const gstAmount =
      quotation.include_gst && quotation.gst_value
        ? (subtotal * Number(quotation.gst_value)) / 100
        : 0;
    const finalTotal = subtotal + gstAmount;

    // Add totals to sheet
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

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    const columnWidths = [
      { wch: 5 }, // S.No
      { wch: 20 }, // Product Image
      { wch: 30 }, // Product Name
      { wch: 15 }, // Product Code
      { wch: 10 }, // MRP
      { wch: 10 }, // Discount
      { wch: 10 }, // Rate
      { wch: 10 }, // Unit
      { wch: 10 }, // Total
    ];
    worksheet["!cols"] = columnWidths;

    // Apply number formatting
    const range = XLSX.utils.decode_range(
      worksheet["!ref"] || "A1:I" + sheetData.length
    );
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell && typeof cell.v === "number") {
          if (col === 4 || col === 6 || col === 8) {
            // MRP, Rate, Total
            cell.z = "₹#,##0.00";
          } else if (col === 5) {
            // Discount
            const productRow = row - 6; // Adjust for header rows
            const product = quotationItems.flatMap((item) => item.items || [])[
              productRow
            ];
            if (product?.discountType === "percent") {
              cell.z = "0.00%";
            } else {
              cell.z = "₹#,##0.00";
            }
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Quotation");

    // Generate buffer instead of saving to file
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=quotation_${req.params.id}.xlsx`
    );

    // Send buffer directly
    res.send(buffer);
  } catch (error) {
    console.error("Export error:", error);
    res
      .status(500)
      .json({ message: "Failed to export quotation", error: error.message });
  }
};
exports.cloneQuotation = async (req, res) => {
  try {
    const originalQuotation = await Quotation.findByPk(req.params.id);
    if (!originalQuotation)
      return res.status(404).json({ message: "Quotation not found" });

    const originalItems = await QuotationItem.findOne({
      quotationId: req.params.id,
    });

    // Generate a new unique ID for the cloned quotation
    const newQuotationId = uuidv4();

    // Create a new quotation with modified details
    const clonedQuotation = await Quotation.create({
      quotationId: newQuotationId,
      quotationTitle: `${originalQuotation.quotationTitle} (Copy)`,
      date: new Date(), // Set new date for the cloned quotation
      customerName: originalQuotation.customerName,
      customerAddress: originalQuotation.customerAddress,
      // Include other relevant fields
    });

    // Duplicate items and associate them with the new quotation
    if (originalItems) {
      const clonedItems = originalItems.items.map((item) => ({
        ...item,
      }));

      await QuotationItem.create({
        quotationId: newQuotationId,
        items: clonedItems,
      });
    }

    res.status(201).json({
      message: "Quotation cloned successfully",
      clonedQuotation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
