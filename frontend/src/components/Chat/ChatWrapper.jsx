// src/components/Chat.js
import React, { useEffect, useRef } from "react";
import { useGetConversationQuery } from "../../api/messageApi";
import { useGetProfileQuery } from "../../api/userApi";
import useSocket from "../../context/useSocket";
import MessageBubble from "./MessageBuble";
import MessageInput from "./MessageInput";
import "./chat.css";
import { useAuth } from "../../context/AuthContext";

const Chat = ({ receiverId }) => {
  const { user } = useAuth();
  const {
    data: conversation,
    isLoading: conversationLoading,
    refetch,
  } = useGetConversationQuery(receiverId);
  const { data: receiverProfile, isLoading: profileLoading } =
    useGetProfileQuery(receiverId);
  const messagesEndRef = useRef(null);

  const { messages, isTyping, handleSendMessage, markAsRead } = useSocket(
    user?.userId,
    refetch,
    conversation // Pass conversation to useSocket to sync initial messages
  );

  useEffect(() => {
    if (conversation && Array.isArray(conversation)) {
      const unreadMessageIds = conversation
        .filter(
          (msg) => msg.receiverId === user?.userId && msg.status !== "read"
        )
        .map((msg) => msg._id);
      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds, user?.userId);
      }
    }
  }, [conversation, user?.userId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <div className="chat-container">
          <div className="chat-header">
            <h3>
              {profileLoading
                ? "Loading..."
                : receiverProfile?.name ||
                  receiverProfile?.username ||
                  "Unknown User"}
            </h3>
            {isTyping && <span className="typing-indicator">Typing...</span>}
            <div className="chat-options">
              <span>Call</span>
              <span>Video</span>
              <span>More</span>
            </div>
          </div>
          <div className="messages">
            {conversationLoading ? (
              <div>Loading messages...</div>
            ) : Array.isArray(messages) && messages.length > 0 ? (
              messages.map((msg, index) => (
                <MessageBubble
                  key={msg._id || index} // Use msg._id if available, fallback to index
                  message={msg}
                  isSent={msg.senderId === user?.userId}
                  isAdmin={
                    msg.roles?.includes("ADMIN") ||
                    msg.roles?.includes("SUPER_ADMIN")
                  }
                />
              ))
            ) : (
              <div>No messages yet.</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <MessageInput
            receiverId={receiverId}
            user={user}
            onSend={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
