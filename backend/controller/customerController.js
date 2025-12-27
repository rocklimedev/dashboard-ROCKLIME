const { sendNotification } = require("./notificationController"); // Import sendNotification
const { Invoice, Customer } = require("../models");
const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60"; // Replace with actual admin user ID or channel
const { Op } = require("sequelize");
// Get invoices by customer ID (no notification needed)
exports.getInvoicesByCustomerId = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const invoices = await Invoice.findAll({
      where: { customerId: id },
    });

    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const requiredFields = ["name", "email"]; // phone2, customerType, gstNumber optional

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Validate customerType if provided
    const allowedTypes = [
      "Retail",
      "Architect",
      "Interior",
      "Builder",
      "Contractor",
    ];
    if (
      req.body.customerType &&
      !allowedTypes.includes(req.body.customerType)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid customerType. Must be one of: ${allowedTypes.join(
          ", "
        )}`,
      });
    }

    const newCustomer = await Customer.create({
      ...req.body,
      phone2: req.body.phone2 || null,
      customerType: req.body.customerType || null,
      gstNumber: req.body.gstNumber || null, // Add GST number here
    });

    // Send notification to admin/system
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "New Customer Created",
      message: `A new customer "${newCustomer.name}" (${newCustomer.email}) has been created.`,
    });

    res.status(201).json({
      success: true,
      data: newCustomer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all customers (no notification needed)
exports.getCustomers = async (req, res) => {
  try {
    // Pagination parameters: ?page=1&limit=20
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // Optional: simple search by name or email
    const where = {};
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${req.query.search}%` } },
        { email: { [Op.iLike]: `%${req.query.search}%` } },
        { phone: { [Op.iLike]: `%${req.query.search}%` } },
      ];
    }

    // Use findAndCountAll for pagination and total count
    const { count: totalCustomers, rows: customers } =
      await Customer.findAndCountAll({
        where,
        offset,
        limit,
        order: [["name", "ASC"]], // or [["createdAt", "DESC"]] depending on preference
        attributes: { exclude: ["createdAt", "updatedAt"] }, // optional: remove timestamps if not needed
        subQuery: false, // safe to include even without nested includes
      });

    const totalPages = Math.ceil(totalCustomers / limit);

    return res.status(200).json({
      success: true,
      data: customers.map((customer) => customer.toJSON()),
      pagination: {
        total: totalCustomers,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("getCustomers error:", error);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to fetch customers",
    });
  }
};

// Get a single customer by ID (no notification needed)
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update customer details
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const allowedTypes = [
      "Retail",
      "Architect",
      "Interior",
      "Builder",
      "Contractor",
    ];
    if (
      req.body.customerType &&
      !allowedTypes.includes(req.body.customerType)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid customerType. Must be one of: ${allowedTypes.join(
          ", "
        )}`,
      });
    }

    await customer.update({
      ...req.body,
      phone2: req.body.phone2 !== undefined ? req.body.phone2 : customer.phone2,
      customerType:
        req.body.customerType !== undefined
          ? req.body.customerType
          : customer.customerType,
      gstNumber:
        req.body.gstNumber !== undefined
          ? req.body.gstNumber
          : customer.gstNumber, // Update GST number
    });

    // Send notification to admin/system
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Customer Updated",
      message: `Customer "${customer.name}" (${customer.email}) has been updated.`,
    });

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // Send notification to admin/system
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Customer Deleted",
      message: `Customer "${customer.name}" (${customer.email}) has been deleted.`,
    });

    await customer.destroy();

    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
