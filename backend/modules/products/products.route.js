const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { auth } = require('../../middleware/auth');
const { guardModule } = require('../../middleware/permission');
const multer = require('multer');
const path = require('path');

router.use(auth);
// "products" permission by HTTP method; stock changes need "inventory" edit.
router.use(
  guardModule('products', [
    { path: /^\/inventory-bulk\//, skip: true }, // checks its own permissions
    { method: 'POST', path: /^\/by-ids$/, action: 'view' },
    {
      method: 'POST',
      path: /^\/[^/]+\/(add-stock|remove-stock)$/,
      module: 'inventory',
      action: 'edit',
    },
    { method: 'POST', path: /^\/bulk-inventory-update$/, module: 'inventory', action: 'edit' },
    { method: 'GET', path: /^\/[^/]+\/history$/, module: 'inventory', action: 'view' },
  ]),
);
router.use('/onboard-brand', require('./brandOnboarding.route'));
router.use('/inventory-bulk', require('./inventory-bulk.route'));

// ====================== MULTER CONFIG ======================
const productUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
}).array('images', 5);

// Helper to handle multer + controller
const withUpload = (handler) => (req, res) => {
  productUpload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image too large. Max 5MB allowed.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Maximum 5 images allowed.' });
      }
      return res.status(400).json({ message: err.message });
    }
    try {
      await handler(req, res);
    } catch (error) {
      console.error('Controller error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });
};

// ====================== ROUTES - PROPER ORDER ======================

// 1. CREATE & BULK
router.post('/', withUpload(productController.createProduct));
router.get('/', productController.getAllProducts);
router.post('/bulk-import', productController.bulkImportProducts);

// 2. STATIC / UTILITY ROUTES (These must come BEFORE dynamic routes)
router.get('/count', productController.getProductCount);
router.get('/company-codes', productController.getCompanyCodes);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/top-selling', productController.getTopSellingProducts);
router.get('/search/all', productController.searchProducts);
router.get('/codes/brand-wise', productController.getAllProductCodesBrandWise);
router.get('/search/get-product-codes', productController.getAllProductCodes);
router.get('/check-code', productController.checkproductCode);

// 3. SPECIFIC PARAMETER ROUTES
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/brand/:brandId', productController.getProductsByBrand);
router.post('/by-ids', productController.getProductsByIds);

// 4. DYNAMIC ID ROUTE - MUST BE AFTER ALL STATIC ROUTES
router.get('/:productId/references', require('./productReferences.controller'));
router.get('/:productId', productController.getProductById);

// 5. UPDATE & DELETE
router.put('/:productId', withUpload(productController.updateProduct));
router.delete('/:productId', productController.deleteProduct);
router.patch('/:productId/featured', productController.updateProductFeatured);

// 6. STOCK MANAGEMENT
router.post('/:productId/add-stock', productController.addStock);
router.post('/:productId/remove-stock', productController.removeStock);
router.get('/:productId/history', productController.getHistoryByProductId);

// 7. KEYWORDS ROUTES
router.put('/:productId/keywords', productController.replaceAllKeywordsForProduct);
router.post('/:productId/keywords', productController.addKeywordsToProduct);
router.delete('/:productId/keywords/:keywordId', productController.removeKeywordFromProduct);
router.delete('/:productId/keywords', productController.removeAllKeywordsFromProduct);
// routes/productRoutes.js
router.post('/bulk-inventory-update', productController.bulkInventoryUpdate);
module.exports = router;
