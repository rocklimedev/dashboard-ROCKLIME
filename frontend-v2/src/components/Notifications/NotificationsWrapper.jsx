// src/components/notifications/NotificationsOverlay.jsx  (or wherever you keep it)

import React, { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { message } from "antd";
import { io } from "socket.io-client";
import { formatDistanceToNow, parseISO, differenceInSeconds } from "date-fns";
import { API_URL } from "../../store/config";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useClearAllNotificationsMutation,
  useDeleteNotificationMutation,
} from "../../api/notificationApi";

// Import the extracted component
import NotificationItem from "./NotificationItem";   // adjust path if needed

const NotificationsOverlay = ({ isOpen, onClose }) => {
  const { auth } = useAuth();
  const userId = auth?.user?.userId;

  const { data: notifications = [], refetch } = useGetNotificationsQuery(
    undefined,
    { skip: !userId }
  );

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [clearAllNotifications, { isLoading: isClearing }] =
    useClearAllNotificationsMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const overlayRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!userId || !isOpen) return;

    const socket = io(API_URL, { transports: ["websocket"] });
    socket.on("connect", () => socket.emit("join", userId));
    socket.on("newNotification", refetch);
    socket.on("notificationsCleared", refetch);
    socket.on("notificationDeleted", refetch);
    socket.on("notificationsDeleted", refetch);

    return () => socket.disconnect();
  }, [userId, isOpen, refetch]);

  // Auto-mark notifications older than 1 hour as read
  useEffect(() => {
    if (!notifications.length) return;

    const interval = setInterval(() => {
      const now = new Date();
      notifications.forEach((n) => {
        if (
          !n.read &&
          differenceInSeconds(now, parseISO(n.createdAt)) >= 3600
        ) {
          markNotificationAsRead(n._id);
        }
      });
    }, 60_000); // check every minute

    return () => clearInterval(interval);
  }, [notifications, markNotificationAsRead]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id).unwrap();
    } catch {
      message.error("Failed to mark as read");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      message.success("Deleted");
    } catch {
      message.error("Failed to delete");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications().unwrap();
      message.success("All cleared");
    } catch {
      message.error("Failed to clear");
    }
  };

  const handleNotificationClick = (notification) => {
    let url = "/"; // fallback

    if (notification.type === "like" || notification.type === "comment") {
      url = `/post/${notification.postId || ""}`;
    } else if (notification.type === "follow" || notification.type === "mention") {
      url = `/u/${notification.userId?._id}`;
    } else if (notification.url) {
      url = notification.url;
    }

    window.location.href = url;

    if (!notification.read) {
      handleMarkRead(notification._id);
    }
    onClose();
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1040,
        }}
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div
        ref={overlayRef}
        className="position-fixed bg-white shadow-lg d-flex flex-column"
        style={{
          top: 0,
          bottom: 0,
          right: 0,
          width: "420px",
          maxWidth: "100%",
          zIndex: 1050,
          borderTopLeftRadius: "12px",
          borderBottomLeftRadius: "12px",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Mobile bottom sheet style override */}
        <style jsx>{`
          @media (max-width: 767.98px) {
            div[ref="overlayRef"] {
              top: auto;
              bottom: 0;
              left: 0;
              right: 0;
              width: 100%;
              height: 90vh;
              border-radius: 16px 16px 0 0;
              transform: ${isOpen ? "translateY(0)" : "translateY(100%)"} !important;
              transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
            }
          }
        `}</style>

        {/* Header */}
        <div className="border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold">Notifications</h5>
            {unreadCount > 0 && (
              <small className="text-primary">{unreadCount} new</small>
            )}
          </div>
          <div className="d-flex align-items-center gap-3">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="btn btn-sm btn-outline-danger"
              >
                {isClearing ? "Clearing..." : "Clear all"}
              </button>
            )}
            <button
              onClick={onClose}
              className="btn btn-link text-dark p-0"
              aria-label="Close"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-grow-1 overflow-auto">
          {!userId ? (
            <div className="text-center py-5 text-muted">
              Please log in to see notifications
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bell fs-1 mb-3 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const ageSec = differenceInSeconds(
                new Date(),
                parseISO(n.createdAt)
              );
              const canMarkManually = ageSec < 3600 && !n.read;

              return (
                <NotificationItem
                  key={n._id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  canMarkManually={canMarkManually}
                  onClickNotification={handleNotificationClick}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsOverlay;