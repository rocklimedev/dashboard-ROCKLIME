const express = require("express");
const addressController = require("../controller/addressController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access control
const { ROLES } = require("../config/constant");

const router = express.Router();

// Admin and Accounts can create an address
router.post(
  "/",
  role.check(ROLES.Admin), // Only Admin can create addresses
  checkPermission("write", "/addresses"),
  addressController.createAddress
);

// All roles can view addresses
router.get(
  "/",
  role.check(ROLES.Users), // Minimum Users role required
  checkPermission("view", "/addresses"),
  addressController.getAllAddresses
);

// All roles can view a specific address
router.get(
  "/:addressId",
  role.check(ROLES.Users),
  checkPermission("view", "/addresses/:addressId"),
  addressController.getAddressById
);

// Only Admin and Accounts can edit an address
router.put(
  "/:addressId",
  role.check(ROLES.Admin), // Only Admin can edit
  checkPermission("edit", "/addresses/:addressId"),
  addressController.updateAddress
);

// Only Admin and SuperAdmin can delete an address
router.delete(
  "/:addressId",
  role.check(ROLES.SuperAdmin), // Only SuperAdmin can delete
  checkPermission("delete", "/addresses/:addressId"),
  addressController.deleteAddress
);

module.exports = router;
