// src/components/MessageBubble.js
import React from "react";
import "./chat.css";

const MessageBubble = ({ message, isSent, isAdmin }) => {
  return (
    <div
      className={`message ${isSent ? "sent" : "received"} ${
        isAdmin ? "admin" : ""
      }`}
    >
      <p>{message.content}</p>
      <div className="message-meta">
        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
        {isSent && (
          <span className={`status ${message.status}`}>
            {message.status === "sent" && "✓"}
            {message.status === "delivered" && "✓✓"}
            {message.status === "read" && "✓✓"}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
