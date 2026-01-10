// NotificationsOverlay.jsx (or NotificationsWrapper.jsx)
import React, { useEffect, useRef, useState } from "react";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useClearAllNotificationsMutation,
  useDeleteNotificationMutation,
} from "../../api/notificationApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "react-avatar";
import { message } from "antd";
import { formatDistanceToNow, parseISO, differenceInSeconds } from "date-fns";
import { io } from "socket.io-client";
import { API_URL } from "../../data/config";

const SWIPE_THRESHOLD = 80;

const NotificationItem = ({
  notification,
  onMarkRead,
  onDelete,
  canMarkManually,
  onClickNotification,
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [translateX, setTranslateX] = useState(0);

  const handleTouchStart = (e) => setTouchStart(e.changedTouches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.changedTouches[0].clientX);

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > SWIPE_THRESHOLD;

    setTranslateX(isLeftSwipe ? -160 : 0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const resetSwipe = () => setTranslateX(0);

  return (
    <div className="position-relative overflow-hidden">
      {/* Swipe Actions - Mobile Only */}
      <div
        className="d-md-none position-absolute top-0 end-0 h-100 d-flex align-items-center"
        style={{
          width: "160px",
          background: "#dc3545",
          transform: `translateX(${translateX + 160}px)`,
          transition: "transform 0.3s ease",
          zIndex: 1,
        }}
      >
        <button
          className="flex-fill h-100 text-white border-0 bg-success"
          onClick={() => {
            onMarkRead(notification._id);
            resetSwipe();
          }}
        >
          Mark Read
        </button>
        <button
          className="flex-fill h-100 text-white border-0 bg-danger"
          onClick={() => {
            onDelete(notification._id);
            resetSwipe();
          }}
        >
          Delete
        </button>
      </div>

      {/* Notification Card */}
      <div
        className={`bg-white border-bottom position-relative cursor-pointer ${
          !notification.read ? "bg-light" : ""
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform 0.3s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (translateX !== 0) {
            e.stopPropagation();
            resetSwipe();
            return;
          }
          onClickNotification(notification);
        }}
      >
        <div className="p-3">
          <div className="d-flex align-items-start">
            {/* Unread Dot */}
            {!notification.read && (
              <div
                className="me-3 mt-1"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: "#1890ff",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
            )}
            {notification.read && (
              <div className="me-3" style={{ width: 34 }} />
            )}

            <a
              href={`/u/${notification.userId?._id || "#"}`}
              onClick={(e) => e.stopPropagation()}
              className="me-3 flex-shrink-0"
            >
              <Avatar
                name={notification.userId?.username || "User"}
                src={notification.userId?.profileImage}
                size="40"
                round={true}
                color="#1890ff"
                textSizeRatio={2}
              />
            </a>

            <div className="flex-grow-1 min-width-0">
              <p className="mb-1 text-sm">
                <a
                  href={`/u/${notification.userId?._id || "#"}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-decoration-none fw-medium text-dark"
                >
                  {notification.userId?.username || "Someone"}
                </a>{" "}
                <span className="text-dark">{notification.title}</span>
              </p>
              <p className="text-muted small mb-1 text-truncate">
                {notification.message}
              </p>
              <small className="text-muted">
                {formatDistanceToNow(parseISO(notification.createdAt), {
                  addSuffix: true,
                })}
              </small>

              {canMarkManually && (
                <div className="d-none d-md-block mt-2">
                  <button
                    className="btn btn-link btn-sm p-0 text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkRead(notification._id);
                    }}
                  >
                    Mark as read
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  // Real-time socket updates
  useEffect(() => {
    if (!userId || !isOpen) return;

    const socket = io(API_URL, { transports: ["websocket"] });
    socket.on("connect", () => socket.emit("join", userId));
    socket.on("newNotification", () => refetch());
    socket.on("notificationsCleared", () => refetch());
    socket.on("notificationDeleted", () => refetch());
    socket.on("notificationsDeleted", () => refetch());

    return () => socket.disconnect();
  }, [userId, isOpen, refetch]);

  // Auto mark as read after 1 hour
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
    }, 60_000);
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
    } else if (
      notification.type === "follow" ||
      notification.type === "mention"
    ) {
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

      {/* Panel - Responsive Design */}
      <div
        ref={overlayRef}
        className="position-fixed bg-white shadow-lg d-flex flex-column"
        style={{
          // Desktop & Tablet: Right-side narrow panel
          top: 0,
          bottom: 0,
          right: 0,
          width: "420px",
          maxWidth: "100%",
          zIndex: 1050,
          borderTopLeftRadius: "12px",
          borderBottomLeftRadius: "12px",

          // Mobile: Full-width bottom sheet
          "@media (max-width: 767.98px)": {
            top: "auto",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "90vh",
            borderRadius: "16px 16px 0 0",
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },

          // Animation
          transform: isOpen ? "translateX(0)" : "translateX(100%)", // Desktop: slide from right
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Mobile Bottom Sheet Animation Override */}
        <style jsx>{`
          @media (max-width: 767.98px) {
            div[ref="overlayRef"] {
              transform: ${isOpen
                ? "translateY(0)"
                : "translateY(100%)"} !important;
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

        {/* Body */}
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
