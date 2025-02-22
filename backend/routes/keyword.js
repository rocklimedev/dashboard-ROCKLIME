const express = require("express");
const keywordController = require("../controllers/keywordController");

const router = express.Router();

// Create keyword
router.post("/keywords", keywordController.createKeyword);

// Get all keywords
router.get("/keywords", keywordController.getAllKeywords);

// Get keyword by ID
router.get("/keywords/:id", keywordController.getKeywordById);

// Update keyword
router.put("/keywords/:id", keywordController.updateKeyword);

// Delete keyword
router.delete("/keywords/:id", keywordController.deleteKeyword);

module.exports = router;
