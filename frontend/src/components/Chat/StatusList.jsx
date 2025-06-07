// src/components/StatusList.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetStatusesQuery } from "../../api/userApi"; // New endpoint needed
import "./chat.css";

const StatusList = () => {
  const { data: statuses, isLoading } = useGetStatusesQuery();
  const navigate = useNavigate();

  if (isLoading) return <div>Loading statuses...</div>;

  return (
    <div className="status-list">
      <h2>Status</h2>
      {statuses?.length === 0 && <p>No status updates.</p>}
      {statuses?.map((status) => (
        <div
          key={status.userId}
          className="status-item"
          onClick={() => navigate(`/status/${status.userId}`)}
        >
          <h3>{status.name || status.username}</h3>
          <p>{status.content}</p>
          <span>{new Date(status.createdAt).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
};

export default StatusList;
