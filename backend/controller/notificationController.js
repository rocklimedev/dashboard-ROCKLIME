const Notification = require("../models/notification"); // Mongoose model
const cron = require("node-cron"); // Add node-cron for scheduling
let ioInstance;
const { User } = require("../models");
// Initialize Socket.IO instance
const initSocket = (io) => {
  ioInstance = io;
};

// Send notification to a specific user
const sendNotification = async ({ userId, title, message }) => {
  let user = null;
  try {
    user = await User.findOne({
      where: { userId },
      attributes: ["userId", "username"],
    });
  } catch (err) {
    console.error("Failed to lookup user for notification", { userId, err });
  }

  // If user not found → log and skip (do NOT throw)
  if (!user) {
    console.warn(`Skipping notification to missing user: ${userId}`);
    return null; // or return some dummy object — but don't throw
  }

  // Proceed only if user exists
  const notification = await Notification.create({ userId, title, message });

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

    // Optionally emit an event to all users to refresh their notifications
    if (ioInstance) {
      ioInstance.emit("notificationsDeleted", {
        message: `${result.deletedCount} notifications deleted`,
      });
    }

    return result;
  } catch (error) {
    throw new Error("Failed to delete old notifications");
  }
};

// Schedule deletion of old notifications (runs daily at midnight)
cron.schedule("0 0 * * *", async () => {
  try {
    await deleteOldNotifications();
  } catch (error) {}
});
// Clear all notifications for a specific user
const clearAllNotifications = async (userId) => {
  try {
    // Delete all notifications for the user from MongoDB
    const result = await Notification.deleteMany({ userId });

    // Verify user exists (optional, for consistency)
    const user = await User.findOne({
      where: { userId },
      attributes: ["userId", "username"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Emit real-time event to the specific user
    if (ioInstance) {
      ioInstance.to(userId).emit("notificationsCleared", {
        userId,
        deletedCount: result.deletedCount,
        message: "All notifications cleared",
      });
    }

    return {
      userId: {
        _id: user.userId,
        username: user.username,
      },
      deletedCount: result.deletedCount,
      message: "All notifications cleared successfully",
    };
  } catch (error) {
    throw new Error(`Failed to clear notifications: ${error.message}`);
  }
};

module.exports = {
  initSocket,
  sendNotification,
  getNotifications,
  markAsRead,
  deleteOldNotifications,
  clearAllNotifications, // Add this
};
