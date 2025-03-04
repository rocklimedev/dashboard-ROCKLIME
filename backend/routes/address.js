const express = require("express");
const addressController = require("../controller/addressController");
const checkPermission = require("../middleware/permission");

const router = express.Router();

router.post(
  "/",
  checkPermission("CREATE_ADDRESS"),
  addressController.createAddress
);
router.get(
  "/",
  checkPermission("VIEW_ADDRESSES"),
  addressController.getAllAddresses
);
router.get(
  "/:addressId",
  checkPermission("VIEW_ADDRESS"),
  addressController.getAddressById
);
router.put(
  "/:addressId",
  checkPermission("UPDATE_ADDRESS"),
  addressController.updateAddress
);
router.delete(
  "/:addressId",
  checkPermission("DELETE_ADDRESS"),
  addressController.deleteAddress
);

module.exports = router;
