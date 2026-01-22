// src/components/CommentRow.jsx
import React from "react";
import { Button, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons"; // not used here but keeping if needed later
const { Text, Title } = Typography;

const CommentRow = ({ comment, onDelete, currentUserId }) => {
  const isCurrentUser = comment.userId === currentUserId;
  const userInitial = comment.user?.name?.[0]?.toUpperCase() || "U";

  return (
    <div
      className={`comment-row ${isCurrentUser ? "comment-row--own" : ""}`}
      style={{
        display: "flex",
        marginBottom: 12,
        justifyContent: isCurrentUser ? "flex-end" : "flex-start",
        padding: "0 8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          maxWidth: "80%",
          flexDirection: isCurrentUser ? "row-reverse" : "row",
        }}
      >
        <div className="avatar">{userInitial}</div>

        <div
          className="comment-bubble"
          style={{
            background: isCurrentUser ? "#f0f2f5" : "#f0f2f5",
            color: isCurrentUser ? "#fff" : "#000", // fixed: was #fff for both → hard to read on light bg
            borderRadius: 12,
            padding: "8px 12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text strong>{comment.user?.name || "Unknown User"}</Text>

            {isCurrentUser && (
              <Button
                type="link"
                danger
                style={{
                  padding: 0,
                  fontSize: "0.85rem",
                }}
                onClick={() => onDelete(comment._id)}
              >
                Delete
              </Button>
            )}
          </div>

          <Text>{comment.comment}</Text>

          <div>
            <Text
              type="secondary"
              style={{ fontSize: "0.75rem", display: "block", marginTop: 4 }}
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
    </div>
  );
};

export default CommentRow;