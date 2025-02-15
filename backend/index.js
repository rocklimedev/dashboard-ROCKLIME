require("dotenv").config();
const socketio = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./config/database");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const orderRoutes = require("./routes/order");
const roleRoutes = require("./routes/roles");
const permissionRoutes = require("./routes/permission");
const addressRoutes = require("./routes/address");
const setupDB = require("./utils/db");
const app = express();
const helmet = require("helmet");
const keys = require("./config/keys");
// Middleware
const { port } = keys;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: false, // Adjust as per your project needs
    frameguard: true,
  })
);
// Database Setup
setupDB();
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permission", permissionRoutes);
app.use("/api/address", addressRoutes);

// Sync Database
db.sync()
  .then(() => console.log("Database connected and synced successfully."))
  .catch((err) => console.error("Database connection failed:", err));

const server = app.listen(port, async () => {
  console.log(`✓ Listening on port ${port}. Visit http://localhost:${port}/`);
});
// Initialize Socket
const io = socketio(server);
require("./socket")(io); // Pass the io object to the socket handler
