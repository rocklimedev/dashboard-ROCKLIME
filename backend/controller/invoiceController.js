const { v4: uuidv4 } = require("uuid");
const { Invoice, Customer, Address } = require("../models");
// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      customerId,
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
      invoiceNo,
    } = req.body;

    // Validate required fields
    if (
      !customerId ||
      !createdBy ||
      !billTo ||
      !amount ||
      !invoiceDate ||
      !dueDate ||
      !status ||
      !products ||
      !invoiceNo
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate customer
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // Validate shipTo if provided
    let shipToAddressId = null;
    if (shipTo) {
      const address = await Address.findByPk(shipTo);
      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipping address ID",
        });
      }
      shipToAddressId = address.addressId;
    } else {
      // Optional: Get default address
      const defaultAddress = await Address.findOne({
        where: { userId: createdBy },
      });
      if (defaultAddress) {
        shipToAddressId = defaultAddress.addressId;
      }
    }

    // Validate products
    let parsedProducts;
    try {
      parsedProducts = JSON.parse(products);
      if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Products must be a non-empty array",
        });
      }
      for (const product of parsedProducts) {
        if (
          !product.productId ||
          typeof product.price !== "number" ||
          product.price < 0 ||
          typeof product.quantity !== "number" ||
          product.quantity < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each product must have a valid productId, non-negative price, and positive quantity",
          });
        }
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid products format",
      });
    }

    // Create invoice
    const invoice = await Invoice.create({
      invoiceId: uuidv4(),
      createdBy,
      customerId,
      billTo,
      shipTo: shipToAddressId,
      amount: parseFloat(amount.toFixed(2)),
      invoiceDate,
      dueDate,
      paymentMethod,
      status,
      products,
      signatureName,
      invoiceNo,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll();
    return res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
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
    if (!customerId || !invoiceDate || !status || !products || !amount) {
      return res.status(400).json({
        success: false,
        message:
          "Customer ID, invoice date, status, products, and amount are required",
      });
    }

    // Validate customer
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // Validate shipTo if provided
    if (shipTo) {
      const address = await Address.findByPk(shipTo);
      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipping address ID",
        });
      }
    }

    // Validate products
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

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

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Delete invoice
    await invoice.destroy();

    res.status(200).json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Change invoice status
exports.changeInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = [
      "paid",
      "unpaid",
      "partially paid",
      "void",
      "refund",
    ];
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

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
