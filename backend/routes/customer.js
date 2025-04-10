const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");
const checkPermission = require("../middleware/permission");
const role = require("../middleware/role"); // Role-based access middleware
const { ROLES } = require("../config/constant");

// Only Admin, SuperAdmin, and Sales can create a customer
router.post(
  "/",
  //role.check(ROLES.SALES), // Minimum role required is Sales
  // checkPermission("write", "/customers"),
  customerController.createCustomer
);

// Admin, SuperAdmin, Sales, and Accounts can view customers
router.get(
  "/",
  // role.check(ROLES.Accounts), // Minimum role required is Accounts
  // checkPermission("view", "/customers"),
  customerController.getCustomers
);

// Admin, SuperAdmin, Sales, and Accounts can view a specific customer
router.get(
  "/:id",
  // role.check(ROLES.Accounts),
  // checkPermission("view", "/customers/:id"),
  customerController.getCustomerById
);

// Only Admin and SuperAdmin can edit a customer
router.put(
  "/:id",
  //  role.check(ROLES.Admin), // Only Admins can edit customers
  //  checkPermission("edit", "/customers/:id"),
  customerController.updateCustomer
);

// Only SuperAdmin can delete a customer
router.delete(
  "/:id",
  //  role.check(ROLES.SuperAdmin), // Only SuperAdmin can delete customers
  //checkPermission("delete", "/customers/:id"),
  customerController.deleteCustomer
);
router.get("/:id/invoices", customerController.getInvoicesByCustomerId);

module.exports = router;
