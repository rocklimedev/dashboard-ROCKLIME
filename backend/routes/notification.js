const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  sendNotification,
} = require("../controller/notificationController");
const { auth } = require("../middleware/auth"); // Authentication Middleware

// Get all notifications for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await getNotifications(req.user.userId);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark a notification as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    // Optionally emit an update via Socket.IO
    if (ioInstance) {
      ioInstance.to(req.user.userId).emit("notificationUpdated", notification);
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send a notification (e.g., for admin or testing purposes)
router.post("/", auth, async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    // Optionally restrict to admin users
    if (!req.user.isAdmin && userId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const notification = await sendNotification({ userId, title, message });
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
