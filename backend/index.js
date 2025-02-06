require("dotenv").config();
const socketio = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./config/database");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");
const adminRoutes = require("./routes/admin");
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
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
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
