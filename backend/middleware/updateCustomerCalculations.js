const Invoice = require("../models/invoice");
const Address = require("../models/address");
const { v4: uuidv4 } = require("uuid");
const Customer = require("../models/customers");
const { Op } = require("sequelize");
const { INVOICE_STATUS } = require("../config/constant");

// Middleware to update customer calculations
const updateCustomerCalculations = async (req, res, next) => {
  try {
    // Extract customerId from request body or params (depending on the operation)
    let customerId = req.body.customerId || req.invoice?.customerId;

    // For deleteInvoice, customerId is retrieved from the invoice being deleted
    if (!customerId && req.params.id) {
      const invoice = await Invoice.findByPk(req.params.id);
      customerId = invoice?.customerId;
    }

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required for calculations",
      });
    }

    // Find the customer
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Fetch all invoices for the customer (excluding 'refund' and 'void')
    const invoices = await Invoice.findAll({
      where: {
        customerId,
        status: {
          [Op.notIn]: ["refund", "void"],
        },
      },
      attributes: ["amount", "status", "dueDate"],
    });

    // Initialize calculations
    let totalAmount = 0;
    let paidAmount = 0;
    let latestDueDate = null;

    // Process invoices
    for (const invoice of invoices) {
      const amount = parseFloat(invoice.amount);
      totalAmount += amount;

      if (["paid", "partially paid"].includes(invoice.status)) {
        // If partial payments are stored in paymentMethod JSON, parse them here
        // Example: paidAmount += invoice.paymentMethod?.paidAmount || amount;
        paidAmount += amount; // Assuming full amount for simplicity
      }

      if (invoice.dueDate) {
        const invoiceDueDate = new Date(invoice.dueDate);
        if (!latestDueDate || invoiceDueDate > latestDueDate) {
          latestDueDate = invoiceDueDate;
        }
      }
    }

    // Calculate balance
    const balance = totalAmount - paidAmount;

    // Determine invoice status
    let invoiceStatus = INVOICE_STATUS.DRAFT;
    if (totalAmount === paidAmount && totalAmount > 0) {
      invoiceStatus = INVOICE_STATUS.PAID;
    } else if (paidAmount > 0) {
      invoiceStatus = INVOICE_STATUS.PARTIALLY_PAID;
    } else if (latestDueDate && latestDueDate < new Date()) {
      invoiceStatus = INVOICE_STATUS.OVERDUE;
    } else if (latestDueDate && latestDueDate >= new Date()) {
      invoiceStatus = INVOICE_STATUS.UNDUE;
    }

    // Update customer
    await customer.update({
      totalAmount,
      paidAmount,
      balance,
      dueDate: latestDueDate,
      invoiceStatus,
    });

    // Proceed to the next middleware or response
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating customer calculations",
      error: error.message,
    });
  }
};
