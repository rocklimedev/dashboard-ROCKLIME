const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth"); // Authentication Middleware
const {
  createVendor,
  getVendorById,
  getVendors,
  updateVendor,
  deleteVendor,
  checkVendorId,
} = require("../controller/vendorController");
const checkPermission = require("../middleware/permission");

// ✅ Admin-only Routes
router.post(
  "/",
  auth,
  // checkPermission("write", "create_vendor", "vendors", "/vendors"),
  createVendor
); // Create a new vendor
router.put(
  "/:id",
  auth,
  // checkPermission("edit", "update_vendor", "vendors", "/vendors/:id"),
  updateVendor
); // edit a vendor
router.delete(
  "/:id",
  auth,
  //checkPermission("delete", "delete_vendor", "vendors", "/vendors/:id"),
  deleteVendor
); // Delete a vendor

// ✅ Admin & Moderator Routes
router.get(
  "/",
  auth,
  // checkPermission("view", "get_vendors", "vendors", "/vendors"),
  getVendors
); // Get all vendors
router.get(
  "/:id",
  auth,
  // checkPermission("view", "get_vendor_by_id", "vendors", "/vendors/:id"),
  getVendorById
); // Get vendor by ID
// routes/vendorRoutes.js
router.get("/check-vendor-id/:vendorId", auth, checkVendorId);
module.exports = router;
