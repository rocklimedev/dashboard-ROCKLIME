const Customer = require("../models/customers"); // Import the Customer model

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const requiredFields = ["name", "email"]; // You can add more required fields here if needed

    // Check for missing required fields
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Create customer with all fields provided in the request body
    const newCustomer = await Customer.create(req.body);

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

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single customer by ID
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

    await customer.update(req.body);

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    await customer.destroy();

    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
