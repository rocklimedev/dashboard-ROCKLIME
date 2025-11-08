// src/context/useSocket.js
import { useEffect, useRef } from "react";
import io from "socket.io-client";

const useSocket = (
  userId,
  handleMessage,
  handleTyping,
  handleStopTyping,
  handleMessageDelivered,
  handleMessagesRead
) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(
      `http://localhost:${process.env.REACT_APP_API_PORT || 5000}`,
      {
        withCredentials: true,
      }
    );
    socketRef.current.emit("join", userId);

    socketRef.current.on("receiveMessage", handleMessage);
    socketRef.current.on("userTyping", handleTyping);
    socketRef.current.on("userStopTyping", handleStopTyping);
    socketRef.current.on("messageDelivered", handleMessageDelivered);
    socketRef.current.on("messagesRead", handleMessagesRead);

    return () => {
      socketRef.current.disconnect();
    };
  }, [
    userId,
    handleMessage,
    handleTyping,
    handleStopTyping,
    handleMessageDelivered,
    handleMessagesRead,
  ]);

  const sendMessage = (message) => {
    socketRef.current.emit("sendMessage", message);
  };

  const sendTyping = (receiverId) => {
    socketRef.current.emit("typing", { senderId: userId, receiverId });
  };

  const sendStopTyping = (receiverId) => {
    socketRef.current.emit("stopTyping", { senderId: userId, receiverId });
  };

  const markAsRead = (messageIds, receiverId) => {
    socketRef.current.emit("markAsRead", { messageIds, receiverId });
  };

  return { sendMessage, sendTyping, sendStopTyping, markAsRead };
};

export default useSocket;
