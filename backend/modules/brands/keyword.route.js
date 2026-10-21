const express = require('express');
const router = express.Router();
const keywordController = require('./keyword.controller');
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');
router.use(auth);
router.use(guardModule('keywords'));
// Create keyword
router.post('/', keywordController.createKeyword);

// Get all keywords (with category)
router.get('/', keywordController.getAllKeywords);

// Get keywords by category
router.get('/by-category/:categoryId', keywordController.getKeywordsByCategoryId);

// Get keyword by ID
router.get('/:id', keywordController.getKeywordById);

// Update keyword
router.put('/:id', keywordController.updateKeyword);

// Delete keyword
router.delete('/:id', keywordController.deleteKeyword);

module.exports = router;
