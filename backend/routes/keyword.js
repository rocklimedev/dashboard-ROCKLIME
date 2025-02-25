const express = require("express");
const keywordController = require("../controller/keywordController");

const router = express.Router();

// Create keyword
router.post("/", keywordController.createKeyword);

// Get all keywords
router.get("/", keywordController.getAllKeywords);

// Get keyword by ID
router.get("/:id", keywordController.getKeywordById);

// Update keyword
router.put("/:id", keywordController.updateKeyword);

// Delete keyword
router.delete("/:id", keywordController.deleteKeyword);

module.exports = router;
