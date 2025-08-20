// controllers/ContactController.js
const Contact = require("../models/contact");

// Submit a new contact form
exports.submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    // Basic validation (Mongoose schema will also enforce this)
    if (!firstName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "First name, email, and message are required",
      });
    }

    // Create a new contact entry
    const contact = new Contact({
      firstName,
      lastName,
      email,
      phone,
      message,
    });

    // Save to database
    await contact.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
      error: error.message,
    });
  }
};

// Fetch all contact queries
exports.getAllQueries = async (req, res) => {
  try {
    const queries = await Contact.find().sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json({
      success: true,
      message: "Queries retrieved successfully",
      data: queries,
    });
  } catch (error) {
    console.error("Error fetching queries:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
      error: error.message,
    });
  }
};

// Fetch a single query by ID
exports.getQueryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid query ID",
      });
    }

    const query = await Contact.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Query retrieved successfully",
      data: query,
    });
  } catch (error) {
    console.error("Error fetching query by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
      error: error.message,
    });
  }
};

// Delete a query by ID
exports.deleteQuery = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid query ID",
      });
    }

    const query = await Contact.findByIdAndDelete(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Query deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting query:", error);
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
      error: error.message,
    });
  }
};
