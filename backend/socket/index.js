const socketio = require("socket.io");
const jwt = require("jsonwebtoken");
const { ROLES } = require("../config/constant");
const keys = require("../config/keys");
const User = require("../models/user"); // Importing Sequelize-based User model
const support = require("./support");

const authHandler = async (socket, next) => {
  const { token = null } = socket.handshake.auth;
  if (!token) {
    return next(new Error("No token provided"));
  }

  const [authType, tokenValue] = token.trim().split(" ");
  if (authType !== "Bearer" || !tokenValue) {
    return next(new Error("Invalid token format"));
  }

  try {
    const { secret } = keys.jwt;
    const payload = jwt.verify(tokenValue, secret);
    const user = await User.findByPk(payload.id);

    if (!user) {
      return next(new Error("User not found"));
    }

    const isAdmin = user.role === ROLES.Admin; // Role validation
    socket.user = { id: user.id, name: user.name, isAdmin }; // Attach user to socket
    next();
  } catch (err) {
    console.error("Authentication error:", err.message);
    next(new Error("Invalid token"));
  }
};

const socket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(authHandler);

  const onConnection = (socket) => {
    support.supportHandler(io, socket);
  };

  io.on("connection", onConnection);
};

module.exports = socket;
