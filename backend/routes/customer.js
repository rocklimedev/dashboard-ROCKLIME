const express = require("express");
const router = express.Router();
const customerController = require("../controller/customerController");

router.post("/", customerController.createCustomer); // Create a customer
router.get("/", customerController.getCustomers); // Get all customers
router.get("/:id", customerController.getCustomerById); // Get customer by ID
router.put("/:id", customerController.updateCustomer); // Update customer
router.delete("/:id", customerController.deleteCustomer); // Delete customer

module.exports = router;
