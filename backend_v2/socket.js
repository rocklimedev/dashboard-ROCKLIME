module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // User joins their own room
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their notification room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
