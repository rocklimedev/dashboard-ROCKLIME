const Invoice = require("../models/invoice");
const Address = require("../models/address");
const { v4: uuidv4 } = require("uuid");
const Customer = require("../models/customers");
// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      customerId,
      createdBy,
      billTo,
      amount,
      invoiceDate,
      dueDate,
      paymentMethod,
      status,
      products,
      signatureName,
    } = req.body;

    // Get the first address associated with the user (you can customize filter logic)
    const address = await Address.findOne({
      where: {
        userId: createdBy, // dynamically find shipTo from createdBy
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Shipping address not found for this user",
      });
    }

    // Use address.addressId as shipTo
    const invoice = await Invoice.create({
      invoiceId: uuidv4(),
      createdBy,
      customerId,
      billTo,
      shipTo: address.addressId,
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
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll();
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
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
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    const {
      customerId,
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

    // Validate required fields
    if (!customerId) {
      return res
        .status(400)
        .json({ success: false, message: "Customer ID is required" });
    }

    // Validate customerId existence
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer ID" });
    }

    if (!invoiceDate) {
      return res
        .status(400)
        .json({ success: false, message: "Invoice date is required" });
    }
    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one product is required" });
    }

    // Validate shipTo if provided
    if (shipTo) {
      const address = await Address.findByPk(shipTo);
      if (!address) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid shipping address ID" });
      }
    }

    // Validate products
    for (const product of products) {
      if (!product.productId || !product.price || !product.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each product must have a productId, price, and quantity",
        });
      }
      if (typeof product.price !== "number" || product.price < 0) {
        return res.status(400).json({
          success: false,
          message: "Product price must be a non-negative number",
        });
      }
      if (typeof product.quantity !== "number" || product.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Product quantity must be a positive integer",
        });
      }
    }

    // Validate amount
    if (typeof amount !== "number" || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a non-negative number",
      });
    }

    // Update invoice
    await invoice.update({
      customerId,
      billTo: billTo || null,
      shipTo: shipTo || null,
      amount,
      invoiceDate,
      dueDate: dueDate || null,
      paymentMethod: paymentMethod || null,
      status,
      products,
      signatureName: signatureName || null,
    });

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
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
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
// Change invoice status
exports.changeInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find the invoice
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    // Validate status
    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    // Optional: Validate status against allowed values
    const validStatuses = [
      "paid",
      "unpaid",
      "partially paid",
      "void",
      "refund",
    ]; // Adjust based on your requirements
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    // Update status
    await invoice.update({ status });

    return res.status(200).json({
      success: true,
      message: "Invoice status updated successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
