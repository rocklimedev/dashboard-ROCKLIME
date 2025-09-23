// server.js (updated)
require("dotenv").config();
const socketio = require("socket.io");
const express = require("express");
const cors = require("cors");
const db = require("./config/database");
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
const connectMongoDB = require("./config/dbMongo");
const setupDB = require("./utils/db");
const helmet = require("helmet");
const keys = require("./config/keys");
const otpRoutes = require("./routes/otp");
const productMetaRoutes = require("./routes/productMeta");
const purchaseOrderRoutes = require("./routes/purchaseOrder");
const app = express();

// CORS configuration
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

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true,
  })
);

// Database Setup
connectMongoDB();
setupDB();

// Routes
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
// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

// Sync Database
db.sync()
  .then(() => console.log("Database connected and synced successfully."))
  .catch((err) => console.error("Database connection failed:", err));

// Start server
const server = app.listen(keys.port, async () => {
  console.log(
    `✓ Listening on port ${keys.port}. Visit http://localhost:${keys.port}/`
  );
});

// Initialize Socket
const io = socketio(server, {
  cors: corsOptions, // Use same CORS options for Socket.io
});
require("./socket")(io);
