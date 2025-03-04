const Quotation = require("../models/quotation");
const { v4: uuidv4 } = require("uuid");

// Create a new quotation
exports.createQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.create(
      req.body // Assuming authenticated user
    );

    res.status(201).json({
      quotationId: quotation.quotationId,
      message: "Quotation created successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all quotations
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.findAll();
    res.status(200).json(quotations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single quotation by ID
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id);
    if (!quotation)
      return res.status(404).json({ message: "Quotation not found" });
    res.status(200).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a quotation
exports.updateQuotation = async (req, res) => {
  try {
    const updated = await Quotation.update(req.body, {
      where: { quotationId: req.params.id },
    });
    if (!updated[0])
      return res.status(404).json({ message: "Quotation not found" });
    res.status(200).json({ message: "Quotation updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a quotation
exports.deleteQuotation = async (req, res) => {
  try {
    const deleted = await Quotation.destroy({
      where: { quotationId: req.params.id },
    });
    if (!deleted)
      return res.status(404).json({ message: "Quotation not found" });
    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
