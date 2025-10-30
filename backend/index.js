require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const cron = require("node-cron");

const db = require("./config/database");
const connectMongoDB = require("./config/dbMongo");
const setupDB = require("./utils/db");
const keys = require("./config/keys");
const { initSocket } = require("./controller/notificationController");
const CachedPermission = require("./models/cachedPermission");

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
};

// ------------------- Express App -------------------
const app = express();

// ------------------- CORS Config -------------------
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "https://dashboard-rocklime.vercel.app",
    "https://cmtradingco.vercel.app",
    "https://dashboard-cmtradingco.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ------------------- Middleware -------------------
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true,
  })
);
app.use(require("./middleware/logger"));

// ------------------- Debug Request Logger -------------------
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// ------------------- Route Mounting -------------------
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
// ------------------- Error Handler -------------------
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

// ------------------- Database Setup -------------------
connectMongoDB();
setupDB();

db.sync()
  .then(() => console.log("✅ SQL Database connected & synced."))
  .catch((err) => console.error("❌ SQL Database connection failed:", err));

// ------------------- Cron Job -------------------
cron.schedule("0 0 * * *", async () => {
  try {
    const result = await CachedPermission.deleteMany({});
    console.log(`[CRON] Cleared ${result.deletedCount} cached permissions`);
  } catch (err) {
    console.error("[CRON] Failed to clear CachedPermission:", err);
  }
});

// ------------------- HTTP + Socket.IO Setup -------------------
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOptions });

// Attach io instance globally for all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Initialize socket logic
require("./socket")(io);
initSocket(io);

// ------------------- Start Server -------------------
const PORT = keys.port || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { app, httpServer, io };
