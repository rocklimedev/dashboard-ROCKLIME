const express = require("express");
const router = express.Router();
const invoiceController = require("../controller/invoiceController");
const checkPermission = require("../middleware/permission");
// Create a new invoice
router.post(
  "/",
  //checkPermission("write", "create_invoice", "invoices", "/invoices"),
  invoiceController.createInvoice
);

// Get all invoices
router.get(
  "/",
  // checkPermission("view", "get_all_invoices", "invoices", "/invoices"),
  invoiceController.getAllInvoices
);

// Get an invoice by ID
router.get(
  "/:id",
  // checkPermission("view", "get_invoice_by_id", "invoices", "/invoices/:id"),
  invoiceController.getInvoiceById
);

// Update an invoice by ID
router.put(
  "/:id",
  // checkPermission("edit", "update_invoice", "invoices", "/invoices/:id"),
  invoiceController.updateInvoice
);

// Delete an invoice by ID
router.delete(
  "/:id",
  // checkPermission("delete", "delete_invoice", "invoices", "/invoices/:id"),
  invoiceController.deleteInvoice
);
router.patch("/:id/status", invoiceController.changeInvoiceStatus);
module.exports = router;
