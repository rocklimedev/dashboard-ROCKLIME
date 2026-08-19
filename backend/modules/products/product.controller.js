// controllers/productController.js
// THIN CONTROLLER — all logic lives in services (exact original code preserved)

const crud = require("./services/product-crud.service");
const inventory = require("./services/product-inventory.service");
const variant = require("./services/product-variant.service");
const keyword = require("./services/product-keyword.service");
const bulk = require("./services/product-bulk.service");
const analytics = require("./services/product-analytics.service");

// Re-export everything exactly as before so all existing routes continue to work
module.exports = {
  // CRUD
  createProduct: crud.createProduct,
  updateProduct: crud.updateProduct,
  getAllProducts: crud.getAllProducts,
  getProductById: crud.getProductById,
  deleteProduct: crud.deleteProduct,
  getProductsByCategory: crud.getProductsByCategory,
  getProductsByBrand: crud.getProductsByBrand,
  searchProducts: crud.searchProducts,
  getAllProductCodes: crud.getAllProductCodes,
  updateProductFeatured: crud.updateProductFeatured,
  getProductsByIds: crud.getProductsByIds,
  getProductCount: crud.getProductCount,

  // Inventory
  addStock: inventory.addStock,
  removeStock: inventory.removeStock,
  getHistoryByProductId: inventory.getHistoryByProductId,
  getLowStockProducts: inventory.getLowStockProducts,
  bulkInventoryUpdate: inventory.bulkInventoryUpdate,

  // Variants
  getProductWithVariants: variant.getProductWithVariants,
  createVariant: variant.createVariant,

  // Keywords
  addKeywordsToProduct: keyword.addKeywordsToProduct,
  removeKeywordFromProduct: keyword.removeKeywordFromProduct,
  removeAllKeywordsFromProduct: keyword.removeAllKeywordsFromProduct,
  replaceAllKeywordsForProduct: keyword.replaceAllKeywordsForProduct,

  // Bulk
  getAllProductCodesBrandWise: bulk.getAllProductCodesBrandWise,
  batchCreateProducts: bulk.batchCreateProducts,
  checkproductCode: bulk.checkproductCode,
  bulkImportProducts: bulk.bulkImportProducts,
  processProductBatch: bulk.processProductBatch,

  // Analytics
  getTopSellingProducts: analytics.getTopSellingProducts,
};
