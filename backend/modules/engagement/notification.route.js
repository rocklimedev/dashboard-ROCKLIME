// routes/notification.js
const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  sendNotification,
  deleteOldNotifications,
  clearAllNotifications, // <-- NEW IMPORT
} = require("./notification.controller");
const { auth, isAdmin } = require("../../middleware/auth");
const Notification = require("./models/notification.model");

// Users may only read, mark or delete their own notifications.
const ownNotification = async (req, res, next) => {
  try {
    const n = await Notification.findById(req.params.id).select("userId");
    if (!n) return res.status(404).json({ message: "Notification not found" });
    if (String(n.userId) !== String(req.user.userId) && !isAdmin(req.user)) {
      return res.status(403).json({ message: "Not your notification" });
    }
    next();
  } catch (e) {
    return res.status(400).json({ message: "Invalid notification id" });
  }
};

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
router.put("/:id/read", auth, ownNotification, async (req, res) => {
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
    if (!isAdmin(req.user) && userId !== req.user.userId) {
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
  if (!isAdmin(req.user)) {
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
router.delete("/:id", auth, ownNotification, async (req, res) => {
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
