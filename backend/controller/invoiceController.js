const Invoice = require("../models/invoice");
const { v4: uuidv4 } = require("uuid");

// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      createdBy,
      billTo,
      shipTo,
      amount,

      invoiceDate,
      dueDate,
      paymentMethod,
      status,

      products,
      signatureName,
    } = req.body;

    const invoice = await Invoice.create({
      invoiceId: uuidv4(),
      createdBy,
      billTo,
      shipTo,
      amount,

      invoiceDate,
      dueDate,
      paymentMethod,
      status,

      products,
      signatureName,
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll();
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    await invoice.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    await invoice.destroy();

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
