const express = require("express");
const router = express.Router();
const quotationController = require("../controller/quotationController");
const { auth } = require("../middleware/auth"); // Middleware for authentication

// Create a new quotation
router.post("/add", auth, quotationController.createQuotation);

// Get all quotations
router.get("/", auth, quotationController.getAllQuotations);

// Get a single quotation by ID
router.get("/:id", auth, quotationController.getQuotationById);

// Update a quotation by ID
router.put("/:id", auth, quotationController.updateQuotation);

// Delete a quotation by ID
router.delete("/:id", auth, quotationController.deleteQuotation);

module.exports = router;
