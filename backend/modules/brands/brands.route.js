const express = require('express');
const {
  createBrand,
  getBrandById,
  getBrands,
  updateBrand,
  deleteBrand,
  getTotalProductOfBrand,
} = require('./brand.controller');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');
router.use(auth);
router.use(guardModule('brands'));
// Only Admin and SuperAdmin can create a brand
router.post('/add', createBrand);

// All roles can view brands
router.get('/', getBrands);

// All roles can view a specific brand
router.get('/:id', getBrandById);

// Only Admin and Sales can edit a brand
router.put('/:id', updateBrand);

// Only SuperAdmin can delete a brand
router.delete('/:id', deleteBrand);
router.get('/:brandId/total-products', getTotalProductOfBrand);
module.exports = router;
