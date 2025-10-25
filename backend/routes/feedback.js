// routes/feedbackRoutes.js
const express = require("express");
const router = express.Router();
const {
  submitFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
} = require("../controller/feedbackController");

router.post("/", submitFeedback);
router.get("/", getAllFeedback);
router.get("/:id", getFeedbackById);
router.put("/:id", updateFeedbackStatus);
router.delete("/:id", deleteFeedback);

module.exports = router;
