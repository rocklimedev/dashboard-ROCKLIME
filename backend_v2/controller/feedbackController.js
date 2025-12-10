const Feedback = require("../models/feedback");
const ftp = require("basic-ftp");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// @desc    Upload feedback images and link to feedback entry
// @route   POST /api/feedback/:feedbackId/upload-images
// @access  Private
exports.uploadFeedbackImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const client = new ftp.Client();
    client.ftp.verbose = process.env.NODE_ENV === "development";

    const uploadedUrls = [];

    try {
      await client.access({
        host: process.env.FTP_HOST,
        port: process.env.FTP_PORT || 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: process.env.FTP_SECURE === "true" || false,
      });

      const uploadDir = "/feedback_images";
      await client.ensureDir(uploadDir);
      await client.cd(uploadDir);

      // Upload each image file
      for (const file of req.files) {
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        const stream = bufferToStream(file.buffer);
        await client.uploadFrom(stream, uniqueName);

        const fileUrl = `${process.env.FTP_BASE_URL}/feedback_images/${uniqueName}`;
        uploadedUrls.push(fileUrl);
      }
    } catch (ftpErr) {
      return res
        .status(500)
        .json({ message: "FTP upload failed", error: ftpErr.message });
    } finally {
      client.close();
    }

    // Update feedback document with uploaded image URLs
    const feedback = await Feedback.findById(req.params.feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // Only allow the original user or an admin to modify images
    if (
      feedback.userId.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this feedback" });
    }

    feedback.imageUrls = [...(feedback.imageUrls || []), ...uploadedUrls];
    await feedback.save();

    return res.status(200).json({
      message: "Feedback images uploaded successfully",
      count: uploadedUrls.length,
      fileUrls: uploadedUrls,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
  const { tag, issueType, subject, message, imageUrls, consentToContact } =
    req.body;

  // Validate required fields
  if (!tag || !issueType || !subject || !message) {
    res.status(400);
    throw new Error("Tag, issueType, subject, and message are required");
  }

  // Create feedback entry
  const feedback = await Feedback.create({
    tag,
    issueType,
    subject,
    message,
    consentToContact: consentToContact ?? false,
    userId: req.user.userId,
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
  });

  res.status(201).json({
    success: true,
    message: "Feedback submitted successfully",
    data: feedback,
  });
};

// @desc    Get all feedback (admin only)
// @route   GET /api/feedback
// @access  Private/Admin
exports.getAllFeedback = async (req, res) => {
  const feedbackList = await Feedback.find()
    .populate("userId", "username email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: feedbackList.length,
    data: feedbackList,
  });
};

// @desc    Get feedback by ID
// @route   GET /api/feedback/:id
// @access  Private
exports.getFeedbackById = async (req, res) => {
  const feedback = await Feedback.findById(req.params.id).populate(
    "userId",
    "username email"
  );

  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  const isOwner = feedback.userId?._id?.toString() === req.user.userId;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to view this feedback");
  }

  res.status(200).json({
    success: true,
    data: feedback,
  });
};

// @desc    Update feedback status (admin only)
// @route   PUT /api/feedback/:id
// @access  Private/Admin
exports.updateFeedbackStatus = async (req, res) => {
  const { status } = req.body;

  if (!["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
    res.status(400);
    throw new Error("Invalid status value");
  }

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { status, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  res.status(200).json({
    success: true,
    message: "Feedback status updated successfully",
    data: feedback,
  });
};

// @desc    Delete feedback (admin only)
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
exports.deleteFeedback = async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  await feedback.deleteOne();

  res.status(200).json({
    success: true,
    message: "Feedback deleted successfully",
  });
};
