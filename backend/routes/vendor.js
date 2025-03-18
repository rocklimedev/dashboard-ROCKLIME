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
const { ROLES } = require("../config/constant");

// ✅ Admin-only Routes
router.post("/", auth, role([ROLES.Admin]), createVendor); // Create a new vendor
router.put("/:id", auth, role([ROLES.Admin]), updateVendor); // edit a vendor
router.delete("/:id", auth, role([ROLES.Admin]), deleteVendor); // Delete a vendor

// ✅ Admin & Moderator Routes
router.get("/", auth, role([ROLES.Admin, ROLES.SALES]), getVendors); // Get all vendors
router.get("/:id", auth, role([ROLES.Admin, ROLES.SALES]), getVendorById); // Get vendor by ID

module.exports = router;
