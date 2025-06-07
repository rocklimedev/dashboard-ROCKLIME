// src/components/MessageInput.js
import React, { useState } from "react";
import { useSendMessageMutation } from "../../api/messageApi";
import useSocket from "../../context/useSocket";
import "./chat.css";

const MessageInput = ({ receiverId, user, onSend }) => {
  const [content, setContent] = useState("");
  const [sendMessage] = useSendMessageMutation();
  const { sendSocketMessage, sendTyping, sendStopTyping } = useSocket(
    user?.userId
  );

  const handleTyping = (e) => {
    setContent(e.target.value);
    if (e.target.value.trim()) {
      sendTyping(receiverId);
    } else {
      sendStopTyping(receiverId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user?.userId) return;

    const message = {
      senderId: user.userId,
      receiverId,
      content,
      roles: user.roles || [],
    };

    try {
      await sendMessage({ receiverId, content }).unwrap();
      sendSocketMessage(message);
      setContent("");
      sendStopTyping(receiverId);
      onSend();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-form">
      <input
        type="text"
        value={content}
        onChange={handleTyping}
        placeholder="Type a message..."
      />
      <button type="submit" disabled={!user?.userId}>
        Send
      </button>
    </form>
  );
};

export default MessageInput;
