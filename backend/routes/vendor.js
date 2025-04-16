const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth"); // Authentication Middleware
const role = require("../middleware/role").check; // Role-Based Access Middleware
const {
  createVendor,
  getVendorById,
  getVendors,
  updateVendor,
  deleteVendor,
} = require("../controller/vendorController");
const checkPermission = require("../middleware/permission");
const { ROLES } = require("../config/constant");

// ✅ Admin-only Routes
router.post(
  "/",
  auth,
  checkPermission("write", "create_vendor", "vendors", "/vendors"),
  //role([ROLES.Admin]),
  createVendor
); // Create a new vendor
router.put(
  "/:id",
  auth,
  //role([ROLES.Admin]),
  checkPermission("edit", "update_vendor", "vendors", "/vendors/:id"),
  updateVendor
); // edit a vendor
router.delete(
  "/:id",
  auth,
  //role([ROLES.Admin]),
  checkPermission("delete", "delete_vendor", "vendors", "/vendors/:id"),
  deleteVendor
); // Delete a vendor

// ✅ Admin & Moderator Routes
router.get(
  "/",
  auth,
  //role([ROLES.Admin, ROLES.SALES]),
  checkPermission("view", "get_vendors", "vendors", "/vendors"),
  getVendors
); // Get all vendors
router.get(
  "/:id",
  auth,
  //role([ROLES.Admin, ROLES.SALES]),
  checkPermission("view", "get_vendor_by_id", "vendors", "/vendors/:id"),
  getVendorById
); // Get vendor by ID

module.exports = router;
