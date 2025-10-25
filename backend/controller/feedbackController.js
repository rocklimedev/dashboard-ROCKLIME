// controllers/feedbackController.js
const Feedback = require("../models/feedback");
const asyncHandler = require("express-async-handler");

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  const { tag, message, imageUrls } = req.body;

  // Validate input
  if (!tag || !message) {
    res.status(400);
    throw new Error("Tag and message are required");
  }

  const feedback = new Feedback({
    tag,
    message,
    userId: req.user.userId,
    imageUrls: imageUrls || [],
  });

  const savedFeedback = await feedback.save();
  res.status(201).json({
    message: "Feedback submitted successfully",
    feedback: savedFeedback,
  });
});

// @desc    Get all feedback (admin only)
// @route   GET /api/feedback
// @access  Private/Admin
const getAllFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find()
    .populate("userId", "username email")
    .sort({ createdAt: -1 });
  res.status(200).json(feedback);
});

// @desc    Get feedback by ID
// @route   GET /api/feedback/:id
// @access  Private
const getFeedbackById = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id).populate(
    "userId",
    "username email"
  );

  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  // Allow access to own feedback or admin
  if (
    feedback.userId._id.toString() !== req.user.userId &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to view this feedback");
  }

  res.status(200).json(feedback);
});

// @desc    Update feedback status (admin only)
// @route   PUT /api/feedback/:id
// @access  Private/Admin
const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  feedback.status = status;
  const updatedFeedback = await feedback.save();
  res.status(200).json({
    message: "Feedback status updated successfully",
    feedback: updatedFeedback,
  });
});

// @desc    Delete feedback (admin only)
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  await feedback.remove();
  res.status(200).json({ message: "Feedback deleted successfully" });
});

module.exports = {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
};
