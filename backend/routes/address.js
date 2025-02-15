const express = require("express");
const addressController = require("../controller/addressController");

const router = express.Router();

router.post("/", addressController.createAddress);
router.get("/", addressController.getAllAddresses);
router.get("/:addressId", addressController.getAddressById);
router.put("/:addressId", addressController.updateAddress);
router.delete("/:addressId", addressController.deleteAddress);

module.exports = router;
