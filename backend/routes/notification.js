// routes/notification.js
const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  sendNotification,
  deleteOldNotifications,
} = require("../controller/notificationController");
const { auth } = require("../middleware/auth");

// GET all notifications
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await getNotifications(req.user.userId);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// MARK AS READ
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Emit via Socket.IO
    if (req.io) {
      req.io.to(req.user.userId).emit("notificationUpdated", notification);
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// SEND NOTIFICATION
router.post("/", auth, async (req, res) => {
  try {
    const { userId, title, message } = req.body;
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

// DELETE OLD NOTIFICATIONS (admin only)
router.delete("/old", auth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  try {
    const result = await deleteOldNotifications();

    // Notify ALL clients
    if (req.io) {
      req.io.emit("notificationsDeleted");
    }

    res
      .status(200)
      .json({ message: `${result.deletedCount} notifications deleted` });
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
