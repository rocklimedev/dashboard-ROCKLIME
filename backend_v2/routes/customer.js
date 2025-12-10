const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");
const checkPermission = require("../middleware/permission");

// Only Admin, SuperAdmin, and Sales can create a customer
router.post(
  "/",
  //  checkPermission("write", "create_customer", "customers", "/customers"),
  customerController.createCustomer
);

// Admin, SuperAdmin, Sales, and Accounts can view customers
router.get(
  "/",
  // checkPermission("view", "get_customers", "customers", "/customers"),
  customerController.getCustomers
);

// Admin, SuperAdmin, Sales, and Accounts can view a specific customer
router.get(
  "/:id",
  // checkPermission("view", "get_customer_by_id", "customers", "/customers/:id"),
  customerController.getCustomerById
);

// Only Admin and SuperAdmin can edit a customer
router.put(
  "/:id",
  // checkPermission("edit", "update_customer", "customers", "/customers/:id"),
  customerController.updateCustomer
);

// Only SuperAdmin can delete a customer
router.delete(
  "/:id",
  // checkPermission("delete", "delete_customer", "customers", "/customers/:id"),
  customerController.deleteCustomer
);
router.get(
  "/:id/invoices",
  // checkPermission(
  //   "view",
  //   "get_invoices_by_customer_id",
  //   "customers",
  //   "/customers/:id/invoices"
  // ),
  customerController.getInvoicesByCustomerId
);

module.exports = router;
