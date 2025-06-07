// src/components/ContactList.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetUsersQuery } from "../../api/userApi"; // New endpoint needed
import "./chat.css";

const ContactList = ({ user }) => {
  const { data: users, isLoading } = useGetUsersQuery();
  const navigate = useNavigate();

  if (isLoading) return <div>Loading contacts...</div>;

  return (
    <div className="contact-list">
      <h2>Contacts</h2>
      {users?.map((contact) => (
        <div
          key={contact.userId}
          className="contact-item"
          onClick={() => navigate(`/chat/${contact.userId}`)}
        >
          <h3>{contact.name || contact.username}</h3>
        </div>
      ))}
    </div>
  );
};

export default ContactList;
