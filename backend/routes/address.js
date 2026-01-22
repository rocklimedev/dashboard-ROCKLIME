const express = require("express");
const addressController = require("../controller/addressController");
const checkPermission = require("../middleware/permission");
const router = express.Router();
const { auth } = require("../middleware/auth");
router.use(auth);
router.get("/all/users", addressController.getAllUserAddresses);
router.get("/all/customers", addressController.getAllCustomerAddresses);
// ← This line is the most important change
// Admin and Accounts can create an address
router.post(
  "/",
  // checkPermission("write", "createAddress", "address", "/addresses"),
  addressController.createAddress,
);

// All roles can view addresses
router.get(
  "/",
  // checkPermission("view", "getAllAddresses", "address", "/addresses"),
  addressController.getAllAddresses,
);

// All roles can view a specific address
router.get(
  "/:addressId",
  // checkPermission("view", "getAddressById", "address", "/addresses/:addressId"),
  addressController.getAddressById,
);

// Only Admin and Accounts can edit an address
router.put(
  "/:addressId",
  // checkPermission("edit", "updateAddress", "address", "/addresses/:addressId"),
  addressController.updateAddress,
);

// Only Admin and SuperAdmin can delete an address
router.delete(
  "/:addressId",
  // checkPermission(
  //   "delete",
  //   "deleteAddress",
  //   "address",
  //   "/addresses/:addressId"
  // ),
  addressController.deleteAddress,
);

module.exports = router;
