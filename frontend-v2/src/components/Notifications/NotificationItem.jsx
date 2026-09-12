// src/components/notifications/NotificationItem.jsx
import React, { useState } from "react";
import Avatar from "react-avatar";
import { formatDistanceToNow, parseISO } from "date-fns";

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
      {/* Swipe Actions - Visible only on mobile */}
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

      {/* Main Notification Content */}
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
            {/* Unread indicator dot */}
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

            {/* Avatar */}
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

            {/* Content */}
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

              {/* Desktop-only mark as read link */}
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

export default NotificationItem;