require("dotenv").config();
const express = require("express");
const { createServer } = require("http"); // <-- NEW
const { Server } = require("socket.io"); // <-- NEW
const cors = require("cors");
const helmet = require("helmet");
const db = require("./config/database");
const connectMongoDB = require("./config/dbMongo");
const setupDB = require("./utils/db");
const keys = require("./config/keys");
const { initSocket } = require("./controller/notificationController");

// ------------------- Import Routes -------------------
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const vendorRoutes = require("./routes/vendor");
const orderRoutes = require("./routes/order");
const roleRoutes = require("./routes/roles");
const permissionRoutes = require("./routes/permission");
const addressRoutes = require("./routes/address");
const signatureRoutes = require("./routes/signature");
const categoryRoutes = require("./routes/category");
const parentCategoryRoutes = require("./routes/parentController");
const attendanceRoutes = require("./routes/attendance");
const customerRoutes = require("./routes/customer");
const brandRoutes = require("./routes/brands");
const keywordRoutes = require("./routes/keyword");
const productRoutes = require("./routes/products");
const brandParentRoutes = require("./routes/brandParentCategory");
const rolePermissionRoutes = require("./routes/rolePermission");
const searchRoutes = require("./routes/search");
const contactRoutes = require("./routes/contact");
const cartRoutes = require("./routes/cart");
const companiesRoutes = require("./routes/company");
const quotationRoutes = require("./routes/quotation");
const invoiceRoutes = require("./routes/invoices");
const teamRoutes = require("./routes/teams");
const otpRoutes = require("./routes/otp");
const productMetaRoutes = require("./routes/productMeta");
const purchaseOrderRoutes = require("./routes/purchaseOrder");
const logsRoutes = require("./routes/apiLog");
const notificationRoutes = require("./routes/notification");
const taskRoutes = require("./routes/tasks");
const taskBoardRoutes = require("./routes/taskBoardRoutes");
const feedbackRoutes = require("./routes/feedback");

// ------------------- Express App -------------------
const app = express();

// ------------------- CORS -------------------
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

// Debug request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ------------------- Routes -------------------
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/user", userRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permission", permissionRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/signature", signatureRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/parent-categories", parentCategoryRoutes);
app.use("/api/brand-parent", brandParentRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/keyword", keywordRoutes);
app.use("/api/products", productRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/quotation", quotationRoutes);
app.use("/api/role-permissions", rolePermissionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/product-meta", productMetaRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/taskboards", taskBoardRoutes);
app.use("/api/feedback", feedbackRoutes);

// ------------------- Error Handler -------------------
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

// ------------------- DB Setup -------------------
connectMongoDB();
setupDB();

db.sync()
  .then(() => console.log("Database connected and synced successfully."))
  .catch((err) => console.error("Database connection failed:", err));

// ------------------- HTTP + Socket.IO Server -------------------
const httpServer = createServer(app); // <-- NEW
const io = new Server(httpServer, { cors: corsOptions }); // <-- NEW

// Attach `io` to every request (so routes can use `req.io`)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Your existing socket files
require("./socket")(io);
initSocket(io);

// ------------------- Start Server -------------------
const PORT = keys.port || 5000;
httpServer.listen(PORT, () => {
  console.log(`Listening on port ${PORT}. Visit http://localhost:${PORT}/`);
});

// Export for testing / other modules
module.exports = { app, httpServer, io };
