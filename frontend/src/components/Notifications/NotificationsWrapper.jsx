import React from "react";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
} from "../../api/notificationApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "react-avatar";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Tooltip } from "antd"; // Import Ant Design Tooltip

const NotificationsWrapper = () => {
  const { auth } = useAuth();
  const userId = auth?.user?.userId;

  const {
    data: notifications,
    isLoading,
    error,
  } = useGetNotificationsQuery(userId, { skip: !userId });

  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId).unwrap();
      toast.success("Notification marked as read");
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Placeholder names for fallback
  const placeholderNames = [
    "Elwis Mathew",
    "Elizabeth Olsen",
    "William Smith",
    "Lesley Grauer",
    "Carl Evans",
    "Minerva Rameriz",
  ];

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
          notifications?.map((notification, index) => (
            <div
              key={notification._id}
              className={`card mb-3 border shadow-none ${
                notification.read ? "bg-light" : ""
              }`}
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
                        href={`/u/${notification.userId || "profile"}`}
                        className="avatar avatar-lg avatar-rounded"
                      >
                        <Avatar
                          name={
                            placeholderNames[index % placeholderNames.length] ||
                            "Unknown User"
                          }
                          src={notification.profileImage} // Use profileImage if available
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
                          href={`/u/${notification.userId || "profile"}`}
                          className="h6"
                        >
                          {placeholderNames[index % placeholderNames.length] ||
                            "Unknown User"}
                        </a>{" "}
                        <span>{notification.title}</span>{" "}
                        <a href="javascript:void(0);" className="h6">
                          {notification.message}
                        </a>
                      </p>
                      <small>
                        <i className="far fa-clock me-1"></i>
                        {formatDistanceToNow(parseISO(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </small>
                      {!notification.read && (
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
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsWrapper;
