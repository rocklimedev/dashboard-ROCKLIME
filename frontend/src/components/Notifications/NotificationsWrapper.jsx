import React, { useEffect } from "react";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
} from "../../api/notificationApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "react-avatar";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO, differenceInSeconds } from "date-fns";
import { Tooltip } from "antd";
import { io } from "socket.io-client";
import { API_URL } from "../../data/config";
const NotificationsWrapper = () => {
  const { auth } = useAuth();
  const userId = auth?.user?.userId;

  const {
    data: notifications,
    isLoading,
    error,
    refetch, // Add refetch from RTK Query
  } = useGetNotificationsQuery(undefined, { skip: !userId });

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();

  // Function to mark a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId).unwrap();
      toast.success("Notification marked as read");
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Automatically mark notifications as read after 1 hour
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const checkNotifications = () => {
      const now = new Date();
      notifications.forEach((notification) => {
        if (!notification.read) {
          const createdAt = parseISO(notification.createdAt);
          const ageInSeconds = differenceInSeconds(now, createdAt);
          if (ageInSeconds >= 3600) {
            // 1 hour = 3600 seconds
            handleMarkAsRead(notification._id);
          }
        }
      });
    };

    // Check immediately and then every minute
    checkNotifications();
    const intervalId = setInterval(checkNotifications, 60 * 1000); // Check every minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [notifications]);

  // Listen for notifications deletion event via Socket.IO
  useEffect(() => {
    if (!userId) return;

    const socket = io(process.env.API_URL); // Replace with your API URL

    socket.on("connect", () => {
      socket.emit("join", userId); // Join user-specific room
    });

    socket.on("notificationsDeleted", () => {
      refetch(); // Refetch notifications when deletion occurs
    });

    return () => {
      socket.disconnect(); // Cleanup on unmount
    };
  }, [userId, refetch]);

  return (
    <div className="page-wrapper">
      <div className="content mb-4">
        <div className="page-header">
          <div className="page-title">
            <h4>All Notifications</h4>
            <h6>View your all activities</h6>
          </div>
        </div>

        {!userId ? (
          <div className="text-center">Please log in to view notifications</div>
        ) : isLoading ? (
          <div className="text-center">Loading notifications...</div>
        ) : error ? (
          <div className="text-danger text-center">
            Error loading notifications:{" "}
            {error?.data?.message || "Unknown error"}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="text-center">No notifications available</div>
        ) : (
          notifications?.map((notification, index) => {
            const createdAt = parseISO(notification.createdAt);
            const now = new Date();
            const ageInSeconds = differenceInSeconds(now, createdAt);
            const canMarkManually = ageInSeconds < 3600 && !notification.read;

            return (
              <div
                key={notification._id}
                className={`card mb-3 border shadow-none ${
                  notification.read ? "bg-light" : ""
                }`}
              >
                <div className="px-3 py-3">
                  <Tooltip
                    title={formatDistanceToNow(createdAt, {
                      addSuffix: true,
                    })}
                    placement="right"
                  >
                    <div className="d-flex align-items-center">
                      <div className="d-flex me-2">
                        <a
                          href={`/u/${notification.userId?._id || "profile"}`}
                          className="avatar avatar-lg avatar-rounded"
                        >
                          <Avatar
                            name={
                              notification.userId?.username || "Unknown User"
                            }
                            src={notification.userId?.profileImage}
                            size="40"
                            round={true}
                            className="circular-avatar"
                            color={index % 2 === 0 ? "#28a745" : "#007bff"}
                            textSizeRatio={2}
                          />
                        </a>
                      </div>
                      <div className="flex-fill ml-3">
                        <p className="text-sm lh-140 mb-0">
                          <a
                            href={`/u/${notification.userId?._id || "profile"}`}
                            className="h6"
                          >
                            {notification.userId?.username || "Unknown User"}
                          </a>{" "}
                          <span>{notification.title}</span>{" "}
                          <a href="javascript:void(0);" className="h6">
                            {notification.message}
                          </a>
                        </p>
                        <small>
                          <i className="far fa-clock me-1"></i>
                          {formatDistanceToNow(createdAt, {
                            addSuffix: true,
                          })}
                        </small>
                        {canMarkManually && (
                          <button
                            className="btn btn-sm btn-link text-primary mt-1"
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsWrapper;
