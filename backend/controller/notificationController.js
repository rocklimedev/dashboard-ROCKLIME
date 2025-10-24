const Notification = require("../models/notification"); // Mongoose model
const User = require("../models/users"); // Sequelize User model
const cron = require("node-cron"); // Add node-cron for scheduling
let ioInstance;

// Initialize Socket.IO instance
const initSocket = (io) => {
  ioInstance = io;
};

// Send notification to a specific user
const sendNotification = async ({ userId, title, message }) => {
  // Verify user exists in Sequelize
  const user = await User.findOne({ where: { userId } });
  if (!user) {
    throw new Error("User not found");
  }

  // Save notification in MongoDB
  const notification = await Notification.create({ userId, title, message });

  // Emit notification in real-time via Socket.IO
  if (ioInstance) {
    ioInstance.to(userId).emit("newNotification", {
      ...notification.toObject(),
      userId: {
        _id: user.userId,
        username: user.username,
      },
    });
  }

  return {
    ...notification.toObject(),
    userId: {
      _id: user.userId,
      username: user.username,
    },
  };
};

// Fetch all notifications for a user
const getNotifications = async (userId) => {
  // Fetch notifications from MongoDB
  const notifications = await Notification.find({ userId }).sort({
    createdAt: -1,
  });

  // Fetch user details from Sequelize for each notification
  const populatedNotifications = await Promise.all(
    notifications.map(async (notification) => {
      const user = await User.findOne({
        where: { userId: notification.userId },
        attributes: ["userId", "username"],
      });
      return {
        ...notification.toObject(),
        userId: {
          _id: user?.userId || notification.userId,
          username: user?.username || "Unknown User",
        },
      };
    })
  );

  return populatedNotifications;
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
  if (!notification) {
    return null;
  }

  // Fetch user details for the updated notification
  const user = await User.findOne({
    where: { userId: notification.userId },
    attributes: ["userId", "username"],
  });

  return {
    ...notification.toObject(),
    userId: {
      _id: user?.userId || notification.userId,
      username: user?.username || "Unknown User",
    },
  };
};

// Delete notifications older than 7 days
const deleteOldNotifications = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
    const result = await Notification.deleteMany({
      createdAt: { $lt: sevenDaysAgo },
    });
    console.log(
      `Deleted ${result.deletedCount} notifications older than 7 days`
    );

    // Optionally emit an event to all users to refresh their notifications
    if (ioInstance) {
      ioInstance.emit("notificationsDeleted", {
        message: `${result.deletedCount} notifications deleted`,
      });
    }

    return result;
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    throw new Error("Failed to delete old notifications");
  }
};

// Schedule deletion of old notifications (runs daily at midnight)
cron.schedule("0 0 * * *", async () => {
  console.log(
    "Running scheduled task to delete notifications older than 7 days"
  );
  try {
    await deleteOldNotifications();
  } catch (error) {
    console.error("Scheduled deletion failed:", error);
  }
});

module.exports = {
  initSocket,
  sendNotification,
  getNotifications,
  markAsRead,
  deleteOldNotifications, // Export for potential manual triggering
};
