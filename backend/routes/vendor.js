const express = require("express");
const router = express.Router();
const {createVendor, getVendorById, getVendors, updateVendor, deleteVendor} = require("../controller/vendorController")
router.post("/", createVendor);
router.get("/", getVendors);
router.get("/:id", getVendorById);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);

module.exports = router 