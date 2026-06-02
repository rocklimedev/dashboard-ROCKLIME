import React from "react";
import { Typography, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const CommentRow = ({ comment, onDelete, currentUserId }) => {
  const isCurrentUser = comment.userId === currentUserId;

  const userInitial = comment.user?.name
    ? comment.user.name[0].toUpperCase()
    : "U";

  return (
    <div
      className={`comment-row ${isCurrentUser ? "comment-row--own" : ""}`}
      style={{
        display: "flex",
        justifyContent: isCurrentUser ? "flex-end" : "flex-start",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isCurrentUser ? "row-reverse" : "row",
          alignItems: "flex-start",
          maxWidth: "75%",
          gap: 10,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: isCurrentUser ? "#1890ff" : "#d9d9d9",
            color: isCurrentUser ? "#fff" : "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {userInitial}
        </div>

        {/* Bubble */}
        <div
          style={{
            background: isCurrentUser ? "#1890ff" : "#f5f5f5",
            color: isCurrentUser ? "#fff" : "#111",
            padding: "10px 12px",
            borderRadius: 14,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            position: "relative",
            minWidth: 120,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
              gap: 10,
            }}
          >
            <Text
              strong
              style={{
                fontSize: 12,
                color: isCurrentUser ? "#fff" : "#333",
                opacity: 0.9,
              }}
            >
              {comment.user?.name || "Unknown User"}
            </Text>

            {isCurrentUser && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(comment._id)}
                style={{
                  fontSize: 12,
                  padding: 0,
                  height: "auto",
                  color: isCurrentUser ? "#fff" : "#ff4d4f",
                  opacity: 0.85,
                }}
              />
            )}
          </div>

          {/* Message */}
          <div style={{ fontSize: 14, lineHeight: "1.4" }}>
            {comment.comment}
          </div>

          {/* Timestamp */}
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              opacity: 0.7,
              textAlign: isCurrentUser ? "right" : "left",
            }}
          >
            {new Date(comment.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • {new Date(comment.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentRow;
