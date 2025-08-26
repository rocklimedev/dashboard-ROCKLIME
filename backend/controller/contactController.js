const Contact = require("../models/contact");
const {
  sendMail,
  contactFormEmail,
  adminContactNotification,
} = require("../middleware/sendMail");

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

    // Send confirmation email to user
    const userEmail = contactFormEmail(firstName, message);
    await sendMail(email, userEmail.subject, userEmail.text, userEmail.html);

    // Send notification email to admin
    const adminEmail = adminContactNotification(
      firstName,
      lastName,
      email,
      phone,
      message
    );
    await sendMail(
      "no-reply@static.cmtradingco.com", // Fallback admin email
      adminEmail.subject,
      adminEmail.text,
      adminEmail.html
    );

    // Send success response
    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    // Log email-specific errors but don't fail the response
    if (error.message.includes("Error sending email")) {
      console.warn("Form saved, but email sending failed:", error);
      return res.status(201).json({
        success: true,
        message:
          "Contact form submitted successfully, but email notification failed",
      });
    }
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
// Reply to a contact query via email
// Reply to a contact query via email
exports.replyToEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage, subject } = req.body;

    // Basic validation
    if (!id || !replyMessage || !subject) {
      return res.status(400).json({
        success: false,
        message: "Query ID, subject, and reply message are required",
      });
    }

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid query ID",
      });
    }

    // Find the contact query
    const query = await Contact.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    // Prepare reply email content
    const replyEmail = {
      subject: subject || `Re: Your Contact Query`,
      text: `Dear ${query.firstName},\n\nThank you for reaching out to us. Below is our response to your query:\n\n${replyMessage}\n\nBest regards,\nThe Team`,
      html: `
        <p>Dear ${query.firstName},</p>
        <p>Thank you for reaching out to us. Below is our response to your query:</p>
        <p>${replyMessage}</p>
        <p>Best regards,<br>The Team</p>
      `,
    };

    // Send reply email to the user
    await sendMail(
      query.email,
      replyEmail.subject,
      replyEmail.text,
      replyEmail.html
    );

    // Send success response
    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (error) {
    console.error("Error sending reply email:", error);
    // Log email-specific errors but don't fail the response
    if (error.message.includes("Error sending email")) {
      console.warn("Reply email sending failed:", error);
      return res.status(200).json({
        success: true,
        message: "Reply processing completed, but email sending failed",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
      error: error.message,
    });
  }
};
