// index.js (or server.js)
require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const cron = require("node-cron");
const axios = require("axios");

const db = require("./config/database");
const connectMongoDB = require("./config/dbMongo");
const setupDB = require("./utils/db");
const keys = require("./config/keys");

const LogStatsDaily = require("./models/log_stats_daily");
const CachedPermission = require("./models/cachedPermission");
const ApiLog = require("./models/apiLog"); // assuming you have this model

// Socket & Notification Setup
const { initSocket } = require("./controller/notificationController");
require("./socket"); // your socket.io logic

// ------------------- Route Imports -------------------
const routes = {
  auth: require("./routes/auth"),
  user: require("./routes/user"),
  vendor: require("./routes/vendor"),
  order: require("./routes/order"),
  roles: require("./routes/roles"),
  permission: require("./routes/permission"),
  address: require("./routes/address"),
  signature: require("./routes/signature"),
  category: require("./routes/category"),
  parentCategory: require("./routes/parentController"),
  attendance: require("./routes/attendance"),
  customer: require("./routes/customer"),
  brand: require("./routes/brands"),
  keyword: require("./routes/keyword"),
  product: require("./routes/products"),
  brandParent: require("./routes/brandParentCategory"),
  rolePermission: require("./routes/rolePermission"),
  search: require("./routes/search"),
  contact: require("./routes/contact"),
  cart: require("./routes/cart"),
  company: require("./routes/company"),
  quotation: require("./routes/quotation"),
  invoice: require("./routes/invoices"),
  team: require("./routes/teams"),
  productMeta: require("./routes/productMeta"),
  purchaseOrder: require("./routes/purchaseOrder"),
  logs: require("./routes/apiLog"),
  notification: require("./routes/notification"),
  task: require("./routes/tasks"),
  taskBoard: require("./routes/taskBoardRoutes"),
  feedback: require("./routes/feedback"),
  cachedPermission: require("./routes/cachedPermission"),
  siteMap: require("./routes/siteMap"),
};

// ------------------- Express & HTTP Server -------------------
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:5173",
      "https://dashboard-rocklime.vercel.app",
      "https://cmtradingco.vercel.app",
      "https://dashboard-cmtradingco.vercel.app",
      "http://erp.cmtradingco.com",
      "https://erp.cmtradingco.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
});

// ------------------- Middleware -------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:5173",
  "https://dashboard-rocklime.vercel.app",
  "https://cmtradingco.vercel.app",
  "https://dashboard-cmtradingco.vercel.app",
  "http://erp.cmtradingco.com",
  "https://erp.cmtradingco.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
);

// API Logger (non-blocking)
app.use(require("./middleware/logger"));

// Debug log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Make io available in all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ------------------- Routes -------------------
app.use("/api/auth", routes.auth);
app.use("/api/attendance", routes.attendance);
app.use("/api/user", routes.user);
app.use("/api/order", routes.order);
app.use("/api/roles", routes.roles);
app.use("/api/permission", routes.permission);
app.use("/api/address", routes.address);
app.use("/api/contact", routes.contact);
app.use("/api/signature", routes.signature);
app.use("/api/category", routes.category);
app.use("/api/vendors", routes.vendor);
app.use("/api/parent-categories", routes.parentCategory);
app.use("/api/brand-parent", routes.brandParent);
app.use("/api/customers", routes.customer);
app.use("/api/brands", routes.brand);
app.use("/api/keyword", routes.keyword);
app.use("/api/products", routes.product);
app.use("/api/carts", routes.cart);
app.use("/api/companies", routes.company);
app.use("/api/quotation", routes.quotation);
app.use("/api/role-permissions", routes.rolePermission);
app.use("/api/invoices", routes.invoice);
app.use("/api/teams", routes.team);
app.use("/api/search", routes.search);
app.use("/api/purchase-orders", routes.purchaseOrder);
app.use("/api/product-meta", routes.productMeta);
app.use("/api/logs", routes.logs);
app.use("/api/notifications", routes.notification);
app.use("/api/tasks", routes.task);
app.use("/api/taskboards", routes.taskBoard);
app.use("/api/feedback", routes.feedback);
app.use("/api/cached-permissions", routes.cachedPermission);
app.use("/api/site-maps", routes.siteMap);

// ------------------- Health Checks -------------------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

app.get("/api/health", async (req, res) => {
  try {
    await db.authenticate();
    res.status(200).json({
      status: "OK",
      message: "Server & MySQL are alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
    });
  } catch (err) {
    console.error("[HEALTH] MySQL failed:", err.message);
    res
      .status(503)
      .json({ status: "ERROR", message: "MySQL down", error: err.message });
  }
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR]", err.stack || err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// ------------------- CRON JOBS -------------------

// Clear cached permissions daily at 2 AM
cron.schedule("0 2 * * *", async () => {
  try {
    const { deletedCount } = await CachedPermission.deleteMany({});
    console.log(`[CRON] Cleared ${deletedCount} cached permissions`);
  } catch (err) {
    console.error("[CRON] Failed to clear cached permissions:", err);
  }
});

// Daily API stats at 1 AM
cron.schedule("0 1 * * *", async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date(yesterday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await ApiLog.aggregate([
      { $match: { createdAt: { $gte: yesterday, $lt: tomorrow } } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          avgDuration: { $avg: "$duration" },
          errorCount: { $sum: { $cond: [{ $gte: ["$status", 400] }, 1, 0] } },
          methods: { $push: "$method" },
          statuses: { $push: "$status" },
        },
      },
    ]);

    if (stats.length > 0) {
      const s = stats[0];
      await LogStatsDaily.findOneAndUpdate(
        { date: yesterday },
        {
          date: yesterday,
          totalRequests: s.totalRequests,
          avgDuration: Math.round(s.avgDuration || 0),
          errorRate: Math.round((s.errorCount / s.totalRequests) * 10000) / 100,
          methodBreakdown: s.methods.reduce(
            (a, m) => ((a[m] = (a[m] || 0) + 1), a),
            {}
          ),
          statusBreakdown: s.statuses.reduce(
            (a, st) => ((a[st] = (a[st] || 0) + 1), a),
            {}
          ),
        },
        { upsert: true }
      );
      console.log("[CRON] Daily API stats updated");
    }
  } catch (err) {
    console.error("[CRON] Failed to update stats:", err);
  }
});

// ------------------- KEEP-ALIVE (Render, Railway, etc.) -------------------
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  setInterval(async () => {
    try {
      const url =
        process.env.RENDER_EXTERNAL_URL ||
        `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`;
      await axios.get(`${url}/api/health`, { timeout: 10000 });
      console.log(`[KEEP-ALIVE] Pinged ${url}/api/health`);
    } catch (err) {
      console.error("[KEEP-ALIVE] Failed:", err.code || err.message);
    }
  }, 10 * 60 * 1000); // every 10 mins
}

// ------------------- START SERVER (ONLY ONCE!) -------------------
const PORT = keys.port || process.env.PORT || 5000;

const startServer = async () => {
  try {
    // MongoDB
    await connectMongoDB();
    console.log("MongoDB Connected");

    // Sequelize Associations (CRITICAL — must complete first)
    await setupDB();
    console.log("Sequelize Associations Loaded");

    // Sync MySQL
    await db.sync({ alter: false });
    console.log("MySQL Synced");

    // Start HTTP + WebSocket Server
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket ready on ws://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Initialize Socket.IO notification listeners
    const socketModule = require("./socket");
    socketModule(io); // if it's a function(io)
    initSocket(io);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Export for testing or clustering
module.exports = { app, httpServer, io };
