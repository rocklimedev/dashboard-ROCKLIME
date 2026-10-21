const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth'); // Authentication Middleware
const { guardModule } = require('../../middleware/permission');
const {
  createVendor,
  getVendorById,
  getVendors,
  updateVendor,
  deleteVendor,
  checkVendorId,
} = require('./vendor.controller');

router.use(auth);
router.use(guardModule('vendors'));
// ✅ Admin-only Routes
router.post('/', auth, createVendor); // Create a new vendor
router.put('/:id', auth, updateVendor); // edit a vendor
router.delete('/:id', auth, deleteVendor); // Delete a vendor

// ✅ Admin & Moderator Routes
router.get('/', auth, getVendors); // Get all vendors
router.get('/:id', auth, getVendorById); // Get vendor by ID
// routes/vendorRoutes.js
router.get('/check-vendor-id/:vendorId', auth, checkVendorId);
module.exports = router;
