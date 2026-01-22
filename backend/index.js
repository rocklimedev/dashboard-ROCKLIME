// index.js (or server.js)
require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const cron = require("node-cron");
const LogStatsDaily = require("./models/log_stats_daily");
const db = require("./config/database");
const connectMongoDB = require("./config/dbMongo");
const setupDB = require("./utils/db");
const keys = require("./config/keys");
const { initSocket } = require("./controller/notificationController");
const CachedPermission = require("./models/cachedPermission");
const apiLimiter = require("./middleware/rateLimit");
// ------------------- Route Imports -------------------
const routes = {
  auth: require("./routes/auth"),
  user: require("./routes/user"),
  vendor: require("./routes/vendor"),
  fgs: require("./routes/fgs"),
  order: require("./routes/order"),
  roles: require("./routes/roles"),
  permission: require("./routes/permission"),
  address: require("./routes/address"),
  signature: require("./routes/signature"),
  category: require("./routes/category"),
  parentCategory: require("./routes/parentController"),
  attendance: require("./routes/attendance"),
  import: require("./routes/import"),
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

// ------------------- Express App -------------------
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

// ------------------- CORS & Body Parsing -------------------
const corsOptions = {
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
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ------------------- Security -------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // You can customize later
    frameguard: true,
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }),
);
app.disable("x-powered-by");
app.use((req, res, next) => {
  const blockedPaths = ["/wp-admin", "/wp-login.php", "/phpmyadmin", "/.env"];

  if (blockedPaths.some((p) => req.url.includes(p))) {
    return res.status(444).end(); // nginx-style drop
  }

  next();
});

// ------------------- NON-BLOCKING API LOGGER (FIRE & FORGET) -------------------
app.use(require("./middleware/logger")); // CRITICAL: Updated logger

// ------------------- Optional: Console Debug Logger -------------------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ------------------- Make io available in all routes -------------------
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ------------------- Route Mounting -------------------
app.use("/api", apiLimiter);
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
app.use("/api/imports", routes.import);
app.use("/api/fgs", routes.fgs)
// ------------------- Health Check -------------------
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});
// ------------------- KEEP-ALIVE & DB HEALTH ENDPOINT (CRITICAL FOR RENDER) -------------------
app.get("/api/health", async (req, res) => {
  try {
    // This will wake up MySQL if it's sleeping
    await db.authenticate();
    res.status(200).json({
      status: "OK",
      message: "Server & MySQL are alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
    });
  } catch (err) {
    console.error("[HEALTH CHECK] MySQL connection failed:", err.message);
    res.status(503).json({
      status: "ERROR",
      message: "MySQL connection failed",
      error: err.message,
    });
  }
});
// ------------------- 404 Handler -------------------
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ------------------- Global Error Handler -------------------
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

// ------------------- Database Connections -------------------
connectMongoDB(); // MongoDB for logs, notifications, etc.
// setupDB(); // Any seeders or initial data

// ------------------- Daily Cron: Clear Cached Permissions -------------------
cron.schedule("0 2 * * *", async () => {
  try {
    const result = await CachedPermission.deleteMany({});
    console.log(
      `[CRON] Cleared ${result.deletedCount} cached permissions at 2 AM`,
    );
  } catch (err) {
    console.error("[CRON] Failed to clear cache:", err);
  }
});
cron.schedule("0 1 * * *", async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date(yesterday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await ApiLog.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday, $lt: tomorrow },
        },
      },
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

    if (stats[0]) {
      await LogStatsDaily.findOneAndUpdate(
        { date: yesterday },
        {
          date: yesterday,
          totalRequests: stats[0].totalRequests,
          avgDuration: Math.round(stats[0].avgDuration || 0),
          errorRate: stats[0].totalRequests
            ? Math.round(
                (stats[0].errorCount / stats[0].totalRequests) * 10000,
              ) / 100
            : 0,
          methodBreakdown: (stats[0].methods || []).reduce(
            (a, m) => ((a[m] = (a[m] || 0) + 1), a),
            {},
          ),
          statusBreakdown: (stats[0].statuses || [])
            .filter(Boolean)
            .reduce((a, s) => ((a[s] = (a[s] || 0) + 1), a), {}),
        },
        { upsert: true },
      );
      console.log("[CRON] Daily log stats updated");
    }
  } catch (err) {
    console.error("[CRON] Failed to update log stats:", err);
  }
});
// ------------------- Daily Cron: Delete Old API Logs (Retention: 60 days) -------------------
cron.schedule("0 3 * * *", async () => {
  // Runs daily at 3 AM (after stats cron at 1 AM)
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60); // Keep last 60 days

    const result = await ApiLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(
      `[CRON] Deleted ${result.deletedCount} old API logs (older than 60 days)`,
    );
  } catch (err) {
    console.error("[CRON] Failed to delete old logs:", err);
  }
});
// ------------------- Socket.IO Setup -------------------
require("./socket")(io);
initSocket(io);
// ------------------- KEEP-ALIVE PINGER (PREVENTS RENDER SPIN-DOWN) -------------------
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  const axios = require("axios");

  // Ping ourselves every 10 minutes to keep Render + MySQL awake
  setInterval(
    async () => {
      try {
        const url =
          process.env.RENDER_EXTERNAL_URL ||
          `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`;
        await axios.get(`${url}/api/health`, { timeout: 10000 });
        console.log(
          `[KEEP-ALIVE] Pinged ${url}/api/health → MySQL stays awake`,
        );
      } catch (err) {
        console.error("[KEEP-ALIVE] Ping failed:", err.code || err.message);
      }
    },
    10 * 60 * 1000,
  ); // Every 10 minutes
}
// ------------------- Start Server -------------------
const PORT = keys.port || process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket ready on ws://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = { app, httpServer, io };
