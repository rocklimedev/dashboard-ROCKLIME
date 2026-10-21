const express = require('express');
const router = express.Router();

const bpc = require('./brand-parentcategory.controller');
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');

router.use(auth);
router.use(guardModule('brand_parentcategories'));

// ---------------------------------------------
// BrandParentCategory (Entity) CRUD
// ---------------------------------------------

// Create a BrandParentCategory
router.post('/', bpc.create);

// ✅ Update a BrandParentCategory
router.put('/:id', bpc.update);

// List all BrandParentCategories with their attached brands
router.get('/', bpc.list);

// Get one BrandParentCategory by ID
router.get('/:id', bpc.getById);

// Delete a BrandParentCategory
router.delete('/:id', bpc.delete);

// ---------------------------------------------
// Attach / Detach Brands (M:N Relationship)
// ---------------------------------------------

// Attach one or many brands to a BrandParentCategory
router.post('/:id/brands', bpc.attachBrands);

// Detach a single brand from a BrandParentCategory
router.delete('/:id/brands/:brandId', bpc.detachBrand);

// ---------------------------------------------
// Tree Structure for a BrandParentCategory
// ---------------------------------------------
router.get('/:id/tree', bpc.getBpcTree);

module.exports = router;
