// routes/contact.js
const express = require("express");
const router = express.Router();
const ContactController = require("../controllers/ContactController");

// POST route for contact form submission
router.post("/", ContactController.submitContactForm);

// GET route to fetch all queries
router.get("/", ContactController.getAllQueries);

// GET route to fetch a single query by ID
router.get("/:id", ContactController.getQueryById);

// DELETE route to delete a query by ID
router.delete("/:id", ContactController.deleteQuery);

module.exports = router;
