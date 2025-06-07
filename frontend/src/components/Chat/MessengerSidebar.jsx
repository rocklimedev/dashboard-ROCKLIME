// src/components/Sidebar.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./chat.css";

const MessengerSidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>WhatsApp</h2>
        <div className="user-info">
          <span>{user?.name || user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      <div className="sidebar-nav">
        <button onClick={() => navigate("/")}>Chats</button>
        <button onClick={() => navigate("/status")}>Status</button>
        <button onClick={() => navigate("/contacts")}>Contacts</button>
        <button onClick={() => navigate("/profile")}>Profile</button>
        <button onClick={() => navigate("/settings")}>Settings</button>
      </div>
    </div>
  );
};

export default MessengerSidebar;
