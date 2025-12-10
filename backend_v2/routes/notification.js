// routes/notification.js
const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  sendNotification,
  deleteOldNotifications,
  clearAllNotifications, // <-- NEW IMPORT
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

/* --------------------------------------------------------------
   NEW ROUTE: Clear **all** notifications for the authenticated user
   -------------------------------------------------------------- */
router.delete("/clear", auth, async (req, res) => {
  try {
    const result = await clearAllNotifications(req.user.userId);

    // Emit real-time event to the user whose notifications were cleared
    if (req.io) {
      req.io.to(req.user.userId).emit("notificationsCleared", result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error clearing user notifications:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});
router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await Notification.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Not found" });

    if (req.io) {
      req.io
        .to(req.user.userId)
        .emit("notificationDeleted", { id: req.params.id });
    }
    res.json({ message: "Deleted", id: req.params.id });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
