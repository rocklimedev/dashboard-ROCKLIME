// socket.js

const Message = require("./models/messages");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on("sendMessage", async (data) => {
      const { senderId, receiverId, content, roles } = data;

      try {
        const message = new Message({
          senderId,
          receiverId,
          content,
          roles,
          status: "sent",
        });

        await message.save();
        io.to(receiverId).emit("receiveMessage", message);
        io.to(senderId).emit("receiveMessage", message);
        io.to(receiverId).emit("messageDelivered", { messageId: message._id });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("userTyping", { senderId });
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
      io.to(receiverId).emit("userStopTyping", { senderId });
    });

    socket.on("markAsRead", async ({ messageIds, receiverId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, receiverId, status: { $ne: "read" } },
          { $set: { status: "read" } }
        );
        io.to(receiverId).emit("messagesRead", { messageIds });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
