const express = require('express');
const router = express.Router();
const parentCategoryController = require('./parent-category.controller');
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');
router.use(auth);
router.use(guardModule('parentcategories'));
// Create a parent category - Only Admin and SuperAdmin can create
router.post('/', parentCategoryController.createParentCategory);

// Get all parent categories - Accessible by Sales, Admin, and SuperAdmin
router.get('/', parentCategoryController.getAllParentCategories);

// Get a parent category by ID - Accessible by Sales, Admin, and SuperAdmin
router.get('/:id', parentCategoryController.getParentCategoryById);

// edit a parent category - Only Admin and SuperAdmin can edit
router.put('/:id', parentCategoryController.updateParentCategory);

// Delete a parent category - Only SuperAdmin can delete
router.delete('/:id', parentCategoryController.deleteParentCategory);

// ...
router.get('/:id/with-brands', parentCategoryController.getParentCategoryWithBrandsAndCounts);

module.exports = router;
