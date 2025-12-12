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
import { Tooltip } from "antd";
import { io } from "socket.io-client";
import { API_URL } from "../../data/config";

const SWIPE_THRESHOLD = 80;

const NotificationItem = ({
  notification,
  onMarkRead,
  onDelete,
  canMarkManually,
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [translateX, setTranslateX] = useState(0);
  const itemRef = useRef(null);

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
      {/* Swipe Actions (Mobile only) */}
      <div
        className="d-md-none position-absolute top-0 start-0 h-100 d-flex"
        style={{
          right: 0,
          background: "#dc3545",
          width: 160,
          transform: `translateX(${translateX + 160}px)`,
          transition: "transform 0.3s ease",
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
        ref={itemRef}
        className={`card mb-3 border shadow-none ${
          notification.read ? "bg-light" : ""
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform 0.3s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => translateX !== 0 && (e.stopPropagation(), resetSwipe())}
      >
        <div className="px-3 py-3">
          <Tooltip
            title={formatDistanceToNow(parseISO(notification.createdAt), {
              addSuffix: true,
            })}
            placement="right"
          >
            <div className="d-flex align-items-center">
              <div className="me-3">
                <a
                  href={`/u/${notification.userId?._id || "#"}`}
                  onClick={(e) => e.stopPropagation()}
                  className="avatar avatar-rounded"
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
              </div>

              <div className="flex-fill">
                <p className="mb-1 text-sm">
                  <a
                    href={`/u/${notification.userId?._id || "#"}`}
                    className="text-decoration-none fw-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {notification.userId?.username || "Someone"}
                  </a>{" "}
                  <span className="text-dark">{notification.title}</span>
                </p>
                <p className="text-muted small mb-1">{notification.message}</p>
                <small className="text-muted">
                  {formatDistanceToNow(parseISO(notification.createdAt), {
                    addSuffix: true,
                  })}
                </small>

                {/* Desktop "Mark as Read" */}
                {canMarkManually && (
                  <div className="d-none d-md-block mt-2">
                    <button
                      className="btn btn-link btn-sm p-0 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(notification._id);
                      }}
                    >
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

const NotificationsWrapper = () => {
  const { auth } = useAuth();
  const userId = auth?.user?.userId;

  const { data: notifications = [], refetch } = useGetNotificationsQuery(
    undefined,
    {
      skip: !userId,
    }
  );

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [clearAllNotifications, { isLoading: isClearing }] =
    useClearAllNotificationsMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

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
      message.success("Notification deleted");
    } catch {
      message.error("Failed to delete");
    }
  };

  const handleClearAll = async () => {
    if (!notifications.length) return;
    try {
      await clearAllNotifications().unwrap();
      message.success("All notifications cleared");
    } catch {
      message.error("Failed to clear notifications");
    }
  };

  // Auto-mark after 1 hour
  useEffect(() => {
    if (!notifications.length) return;
    const interval = setInterval(() => {
      const now = new Date();
      notifications.forEach((n) => {
        if (
          !n.read &&
          differenceInSeconds(now, parseISO(n.createdAt)) >= 3600
        ) {
          handleMarkRead(n._id);
        }
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [notifications]);

  // Real-time Socket.IO
  useEffect(() => {
    if (!userId) return;
    const socket = io(API_URL, { transports: ["websocket"] });
    socket.on("connect", () => socket.emit("join", userId));
    socket.on("notificationsDeleted", refetch);
    socket.on("notificationsCleared", refetch);
    socket.on("notificationDeleted", refetch);
    return () => socket.disconnect();
  }, [userId, refetch]);

  // === Render (No loading states — handled globally) ===
  return (
    <div className="page-wrapper">
      <div className="content mb-4">
        <div className="page-header d-flex justify-content-between align-items-center mb-4">
          <div className="page-title">
            <h4>All Notifications</h4>
            <h6>Stay updated with your activities</h6>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className={`btn btn-sm ${
                isClearing ? "btn-secondary" : "btn-outline-danger"
              } d-flex align-items-center`}
            >
              {isClearing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Clearing...
                </>
              ) : (
                <>Clear All</>
              )}
            </button>
          )}
        </div>

        {/* Main Content */}
        {!userId ? (
          <div className="text-center py-5">
            <p className="text-muted">Please log in to view notifications</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No notifications yet</p>
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
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsWrapper;
