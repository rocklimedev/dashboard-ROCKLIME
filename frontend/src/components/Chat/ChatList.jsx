// src/components/ChatList.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./chat.css";
import { useGetRecentConversationsQuery } from "../../api/messageApi";
const ChatList = () => {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useGetRecentConversationsQuery();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  if (isLoading) return <div>Loading chats...</div>;

  const filteredConversations = conversations?.filter(
    (conv) =>
      conv.name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filteredConversations?.length === 0 && <p>No conversations yet.</p>}
      {filteredConversations?.map((conv) => (
        <div
          key={conv.userId}
          className="chat-list-item"
          onClick={() => navigate(`/chat/${conv.userId}`)}
        >
          <div className="chat-list-info">
            <h3>{conv.name || conv.username}</h3>
            <p>{conv.lastMessage}</p>
          </div>
          <div className="chat-list-meta">
            <span>{new Date(conv.createdAt).toLocaleTimeString()}</span>
            {conv.status !== "read" && <span className="unread-badge"></span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
