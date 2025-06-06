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
    const deleted = await Quotation.destroy({
      where: { quotationId: req.params.id },
    });
    if (!deleted)
      return res.status(404).json({ message: "Quotation not found" });

    await QuotationItem.deleteOne({ quotationId: req.params.id });

    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });

    const items = await QuotationItem.findOne({ quotationId: req.params.id });

    // Define the format
    const sheetData = [
      ["Estimate / Quotation", "", "GROHE / AMERICAN STANDARD"],
      [""],
      ["M/s", "", "", "Date", quotation.date],
      ["Address", ""],
      [""],
      ["S.No", "Product Image", "Product Name", "Product Code", "Amount"],
      ["", "", "MRP", "Discount", "Rate", "Unit", "Total"],
    ];

    // Append product items
    items?.items.forEach((item, index) => {
      sheetData.push([
        index + 1, // S.No
        item.imageUrl || "N/A", // Product Image (URL or placeholder)
        item.productName, // Product Name
        item.productCode, // Product Code
        "", // Empty column (for Amount)
        item.mrp, // MRP
        item.discount || 0, // Discount
        item.rate, // Rate
        item.unit, // Unit
        item.total, // Total
      ]);
    });

    // Create a new workbook & sheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Adjust column widths
    const columnWidths = [
      { wch: 5 }, // S.No
      { wch: 20 }, // Product Image
      { wch: 30 }, // Product Name
      { wch: 20 }, // Product Code
      { wch: 10 }, // Amount
      { wch: 10 }, // MRP
      { wch: 10 }, // Discount
      { wch: 10 }, // Rate
      { wch: 10 }, // Unit
      { wch: 10 }, // Total
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample-Quotation");

    // Save file
    const fileName = `${quotation.quotationTitle || "quotation"}.xlsx`;
    const filePath = path.join(__dirname, "../data", fileName);
    XLSX.writeFile(workbook, filePath);

    // Send file for download
    res.download(filePath, fileName, (err) => {
      if (err) {
        res.status(500).json({ message: "Failed to download file" });
      }
      fs.unlinkSync(filePath); // Delete file after download
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
