const Contact = require("../models/contact");
const {
  sendMail,
  contactFormEmail,
  adminContactNotification,
} = require("../middleware/sendMail");
const { sendNotification } = require("./notificationController"); // Import sendNotification

// Assume an admin user ID or system channel for notifications
const ADMIN_USER_ID = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60"; // Replace with actual admin user ID or channel

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

    // Send real-time notification to admin or system channel
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "New Contact Form Submission",
      message: `A new contact form has been submitted by ${firstName} ${
        lastName || ""
      } (${email}): "${message}"`,
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
    });
  } catch (error) {
    // Log email-specific errors but don't fail the response
    if (error.message.includes("Error sending email")) {
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

// Fetch all contact queries (no notification needed)
exports.getAllQueries = async (req, res) => {
  try {
    const queries = await Contact.find().sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json({
      success: true,
      message: "Queries retrieved successfully",
      data: queries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
      error: error.message,
    });
  }
};

// Fetch a single query by ID (no notification needed)
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

    const query = await Contact.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    // Send real-time notification to admin or system channel
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: "Contact Query Deleted",
      message: `Contact query from ${query.firstName} ${
        query.lastName || ""
      } (${query.email}) has been deleted.`,
    });

    await Contact.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Query deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error, please try again later",
      error: error.message,
    });
  }
};

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

    // Send real-time notification to the user (if userId is available)
    // Note: Since Contact model doesn't have userId, we assume a lookup or skip
    // If you have a User model with email-to-userId mapping, you can add it here
    // For now, notify admin as a fallback
    await sendNotification({
      userId: ADMIN_USER_ID, // Replace with actual userId if available
      title: "Reply Sent to Contact Query",
      message: `A reply has been sent to ${query.firstName} ${
        query.lastName || ""
      } (${query.email}): "${replyMessage}"`,
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (error) {
    // Log email-specific errors but don't fail the response
    if (error.message.includes("Error sending email")) {
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
