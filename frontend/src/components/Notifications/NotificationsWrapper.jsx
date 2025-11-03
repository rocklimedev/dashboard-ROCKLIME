import React, { useEffect, useRef, useState } from "react";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useClearAllNotificationsMutation,
  useDeleteNotificationMutation, // NEW
} from "../../api/notificationApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "react-avatar";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO, differenceInSeconds } from "date-fns";
import { Tooltip } from "antd";
import { io } from "socket.io-client";
import { API_URL } from "../../data/config";

const SWIPE_THRESHOLD = 80; // px

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

    if (isLeftSwipe) {
      setTranslateX(-160); // show actions
    } else {
      setTranslateX(0);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const resetSwipe = () => setTranslateX(0);

  // Desktop “Mark as read”
  const desktopMarkBtn = canMarkManually && (
    <button
      className="btn btn-sm btn-link text-primary mt-1 p-0"
      onClick={() => onMarkRead(notification._id)}
    >
      Mark as Read
    </button>
  );

  return (
    <div className="position-relative overflow-hidden">
      {/* Swipe actions (hidden on desktop) */}
      <div
        className="d-md-none position-absolute top-0 start-0 h-100 d-flex align-items-center"
        style={{
          right: 0,
          background: "#dc3545",
          width: 160,
          transform: `translateX(${translateX + 160}px)`,
        }}
      >
        <button
          className="flex-fill h-100 text-white border-0 bg-success"
          onClick={() => {
            onMarkRead(notification._id);
            resetSwipe();
          }}
        >
          <i className="fe fe-check"></i>
        </button>
        <button
          className="flex-fill h-100 text-white border-0 bg-danger"
          onClick={() => {
            onDelete(notification._id);
            resetSwipe();
          }}
        >
          <i className="fe fe-trash-2"></i>
        </button>
      </div>

      {/* Notification card */}
      <div
        ref={itemRef}
        className={`card mb-3 border shadow-none ${
          notification.read ? "bg-light" : ""
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 ? "transform .2s" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (translateX !== 0) {
            e.stopPropagation();
            resetSwipe();
          }
        }}
      >
        <div className="px-3 py-3">
          <Tooltip
            title={formatDistanceToNow(parseISO(notification.createdAt), {
              addSuffix: true,
            })}
            placement="right"
          >
            <div className="d-flex align-items-center">
              <div className="d-flex me-2">
                <a
                  href={`/u/${notification.userId?._id || "profile"}`}
                  className="avatar avatar-lg avatar-rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar
                    name={notification.userId?.username || "Unknown User"}
                    src={notification.userId?.profileImage}
                    size="40"
                    round={true}
                    className="circular-avatar"
                    color={Math.random() > 0.5 ? "#28a745" : "#007bff"}
                    textSizeRatio={2}
                  />
                </a>
              </div>

              <div className="flex-fill ms-3">
                <p className="text-sm lh-140 mb-0">
                  <a
                    href={`/u/${notification.userId?._id || "profile"}`}
                    className="h6 text-decoration-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {notification.userId?.username || "Unknown User"}
                  </a>{" "}
                  <span className="text-dark">{notification.title}</span>{" "}
                  <span className="text-muted">{notification.message}</span>
                </p>

                <small className="text-muted">
                  <i className="far fa-clock me-1"></i>
                  {formatDistanceToNow(parseISO(notification.createdAt), {
                    addSuffix: true,
                  })}
                </small>

                {/* Desktop button */}
                <div className="d-none d-md-block">{desktopMarkBtn}</div>
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

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useGetNotificationsQuery(undefined, { skip: !userId });

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [clearAllNotifications, { isLoading: isClearing }] =
    useClearAllNotificationsMutation();
  const [deleteNotification] = useDeleteNotificationMutation(); // NEW

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(id).unwrap();
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Auto mark after 1 hour
  useEffect(() => {
    if (!notifications.length) return;
    const check = () => {
      const now = new Date();
      notifications.forEach((n) => {
        if (
          !n.read &&
          differenceInSeconds(now, parseISO(n.createdAt)) >= 3600
        ) {
          handleMarkRead(n._id);
        }
      });
    };
    check();
    const iv = setInterval(check, 60_000);
    return () => clearInterval(iv);
  }, [notifications]);

  // Socket.IO real-time
  useEffect(() => {
    if (!userId) return;
    const socket = io(API_URL);
    socket.on("connect", () => socket.emit("join", userId));

    const events = [
      "notificationsDeleted",
      "notificationsCleared",
      "notificationDeleted",
    ];
    events.forEach((ev) => socket.on(ev, refetch));

    return () => socket.disconnect();
  }, [userId, refetch]);

  // Clear All
  const handleClearAll = async () => {
    if (!notifications.length) return;
    try {
      await clearAllNotifications().unwrap();
    } catch {
      toast.error("Failed to clear all");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content mb-4">
        <div className="page-header d-flex justify-content-between align-items-center">
          <div className="page-title">
            <h4>All Notifications</h4>
            <h6>View your all activities</h6>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className={`btn btn-sm ${
                isClearing ? "btn-secondary" : "btn-danger"
              } d-flex align-items-center`}
            >
              {isClearing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Clearing...
                </>
              ) : (
                <>
                  <i className="fe fe-trash-2 me-2"></i>Clear All
                </>
              )}
            </button>
          )}
        </div>

        {/* ---------- CONTENT ---------- */}
        {!userId ? (
          <div className="text-center">Please log in to view notifications</div>
        ) : isLoading ? (
          <div className="text-center">Loading notifications...</div>
        ) : error ? (
          <div className="text-danger text-center">
            {error?.data?.message || "Unknown error"}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-muted">
            <i className="fe fe-bell-off fa-2x mb-3"></i>
            <p>No notifications available</p>
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
