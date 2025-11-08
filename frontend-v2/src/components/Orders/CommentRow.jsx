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
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isCurrentUser ? "row-reverse" : "row",
          alignItems: "flex-start",
          maxWidth: "80%",
          gap: 8,
        }}
      >
        {/* Avatar */}
        <div className="avatar">{userInitial}</div>

        {/* Comment Bubble */}
        <div
          className="comment-bubble"
          style={{
            background: isCurrentUser ? "#1890ff" : "#f0f2f5",
            color: isCurrentUser ? "#fff" : "#000",
          }}
        >
          <div className="comment-header">
            <Text strong>{comment.user?.name || "Unknown User"}</Text>
            {isCurrentUser && (
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(comment._id)}
                style={{
                  padding: 0,
                  fontSize: "0.8rem",
                  color: isCurrentUser ? "#fff" : "#ff4d4f",
                }}
              >
                Delete
              </Button>
            )}
          </div>

          <div className="comment-body">
            <Text>{comment.comment}</Text>
          </div>

          <Text
            type="secondary"
            style={{ fontSize: "0.75rem", display: "block", marginTop: 6 }}
          >
            {new Date(comment.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • {new Date(comment.createdAt).toLocaleDateString()}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default CommentRow;
