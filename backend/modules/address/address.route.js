const express = require("express");
const addressController = require("./address.controller");
const router = express.Router();
const { auth } = require("../../middleware/auth");
const { guardModule } = require("../../middleware/permission");
router.use(auth);
router.use(guardModule("address"));
router.get("/all/users", addressController.getAllUserAddresses);
router.get("/all/customers", addressController.getAllCustomerAddresses);
// ← This line is the most important change
// Admin and Accounts can create an address
router.post(
  "/",
  addressController.createAddress,
);

// All roles can view addresses
router.get(
  "/",
  addressController.getAllAddresses,
);

// All roles can view a specific address
router.get(
  "/:addressId",
  addressController.getAddressById,
);

// Only Admin and Accounts can edit an address
router.put(
  "/:addressId",
  addressController.updateAddress,
);

// Only Admin and SuperAdmin can delete an address
router.delete(
  "/:addressId",
  addressController.deleteAddress,
);

module.exports = router;
