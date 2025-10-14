const Notification = require("../models/notification"); // Mongoose model
let ioInstance;

// Initialize Socket.IO instance
const initSocket = (io) => {
  ioInstance = io;
};

// Send notification to a specific user
const sendNotification = async ({ userId, title, message }) => {
  // Save notification in MongoDB
  const notification = await Notification.create({ userId, title, message });

  // Emit notification in real-time via Socket.IO
  if (ioInstance) {
    ioInstance.to(userId).emit("newNotification", notification);
  }

  return notification;
};

// Fetch all notifications for a user
const getNotifications = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 });
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
};

module.exports = { initSocket, sendNotification, getNotifications, markAsRead };
