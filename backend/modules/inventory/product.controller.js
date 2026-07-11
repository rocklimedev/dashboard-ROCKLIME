// controllers/productController.js

const productCrud = require("../services/product/productCrudService");
const productQuery = require("../services/product/productQueryService");
const productCode = require("../services/product/productCodeService");
const inventory = require("../services/product/inventoryService");
const variants = require("../services/product/variantService");
const keywords = require("../services/product/keywordService");
const bulkImport = require("../services/product/bulkImportService");
const sales = require("../services/product/salesService");

/** Sends a caught error as an HTTP response, respecting err.status if set. */
function handleError(res, error, fallbackMessage) {
  const status = error.status || 500;
  res
    .status(status)
    .json({ message: error.message || fallbackMessage, error: error.message });
}

// ==================== CREATE / READ / UPDATE / DELETE ====================

exports.createProduct = async (req, res) => {
  try {
    const product = await productCrud.createProduct(req);
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    handleError(res, error, "Failed to create product");
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await productCrud.updateProduct(req.params.productId, req);
    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    handleError(res, error, "Failed to update product");
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await productCrud.getProductById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await productCrud.deleteProduct(req.params.productId);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
};

exports.updateProductFeatured = async (req, res) => {
  try {
    const product = await productCrud.updateProductFeatured(
      req.params.productId,
      req.body.isFeatured,
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({
      message: "Product featured status updated successfully",
      product,
    });
  } catch (error) {
    handleError(res, error, "Server error");
  }
};

// ==================== QUERY / LIST / SEARCH ====================

exports.getAllProducts = async (req, res) => {
  try {
    const result = await productQuery.getAllProducts({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search,
      tab: req.query.tab || "all",
      lowStockThreshold: parseInt(req.query.lowStockThreshold) || 10,
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  if (!categoryId)
    return res.status(400).json({ message: "Category ID is required." });

  try {
    const result = await productQuery.getProductsByCategory(
      categoryId,
      req.query,
    );
    res.json(result);
  } catch (error) {
    if (error.message === "Invalid pagination parameters.") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({
      message: "Failed to fetch products by category",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getProductsByBrand = async (req, res) => {
  const { brandId } = req.params;
  if (!brandId)
    return res.status(400).json({ message: "Brand ID is required." });

  try {
    const result = await productQuery.getProductsByBrand(brandId, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products by brand",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const results = await productQuery.searchProducts(req.query);
    res.status(200).json(results);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};

exports.getProductsByIds = async (req, res) => {
  try {
    const result = await productQuery.getProductsByIds(req.body.productIds);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error, "Failed to fetch products by IDs");
  }
};

exports.getAllProductCodes = async (req, res) => {
  try {
    const result = await productQuery.getAllProductCodes();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAllProductCodesBrandWise = async (req, res) => {
  try {
    const result = await productQuery.getAllProductCodesBrandWise();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product codes",
      error: error.message,
    });
  }
};

exports.getProductCount = async (req, res) => {
  try {
    const count = await productQuery.getProductCount();
    res.json({ success: true, totalProducts: count });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch product count" });
  }
};

exports.checkproductCode = async (req, res) => {
  try {
    const exists = await productCode.checkProductCodeExists(req.query.code);
    res.json({ exists });
  } catch (error) {
    res.status(400).json({ exists: false, message: error.message });
  }
};

// ==================== INVENTORY ====================

exports.addStock = async (req, res) => {
  try {
    const result = await inventory.addStock({
      productId: req.params.productId,
      ...req.body,
    });
    res.json({
      message: "Stock added successfully",
      product: result.product,
      inventoryHistory: {
        id: result.history.id,
        action: result.history.action,
        change: result.history.change,
        quantityAfter: result.history.quantityAfter,
        timestamp: result.history.createdAt,
        orderNo: result.history.orderNo,
        userId: result.history.userId,
        message: result.history.message,
      },
    });
  } catch (error) {
    handleError(res, error, "Error adding stock");
  }
};

exports.removeStock = async (req, res) => {
  try {
    const result = await inventory.removeStock({
      productId: req.params.productId,
      ...req.body,
    });
    res.json({
      message: "Stock removed successfully",
      product: result.product,
      inventoryHistory: {
        id: result.history.id,
        action: result.history.action,
        change: result.history.change,
        quantityAfter: result.history.quantityAfter,
        timestamp: result.history.createdAt,
        orderNo: result.history.orderNo,
        userId: result.history.userId,
        message: result.history.message,
      },
    });
  } catch (error) {
    const status =
      error.message === "Insufficient stock" ? 400 : error.status || 500;
    res.status(status).json({ message: error.message });
  }
};

exports.getHistoryByProductId = async (req, res) => {
  try {
    const result = await inventory.getHistoryByProductId(req.params.productId, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    });
    res.json({
      message: "Inventory history retrieved successfully",
      ...result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving history", error: error.message });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const result = await inventory.getLowStockProducts({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      threshold: parseInt(req.query.threshold) || 20,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Low Stock Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch low stock products" });
  }
};

exports.bulkInventoryUpdate = async (req, res) => {
  try {
    const results = await inventory.bulkInventoryUpdate(req.body.updates);
    res.status(200).json({
      message: `Bulk inventory update completed. ${results.successCount} successful, ${results.failedCount} failed.`,
      ...results,
    });
  } catch (error) {
    handleError(res, error, "Bulk inventory update failed");
  }
};

// ==================== VARIANTS ====================

exports.getProductWithVariants = async (req, res) => {
  try {
    const result = await variants.getProductWithVariants(req.params.productId);
    if (!result) return res.status(404).json({ message: "Not found" });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createVariant = async (req, res) => {
  try {
    const variant = await variants.createVariant(req.params.masterId, req.body);
    res.status(201).json({ message: "Variant created", variant });
  } catch (error) {
    handleError(res, error, "Failed to create variant");
  }
};

// ==================== KEYWORDS ====================

exports.addKeywordsToProduct = async (req, res) => {
  try {
    const enrichedKeywords = await keywords.addKeywordsToProduct(
      req.params.productId,
      req.body.keywordIds,
    );
    res.status(200).json({
      message: "Keywords added successfully",
      keywords: enrichedKeywords,
    });
  } catch (error) {
    handleError(res, error, "Failed to add keywords");
  }
};

exports.removeKeywordFromProduct = async (req, res) => {
  try {
    const removed = await keywords.removeKeywordFromProduct(
      req.params.productId,
      req.params.keywordId,
    );
    if (!removed)
      return res
        .status(404)
        .json({ message: "Keyword not associated with this product" });
    res.status(200).json({ message: "Keyword removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeAllKeywordsFromProduct = async (req, res) => {
  try {
    await keywords.removeAllKeywordsFromProduct(req.params.productId);
    res.status(200).json({ message: "All keywords removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.replaceAllKeywordsForProduct = async (req, res) => {
  try {
    const updatedKeywords = await keywords.replaceAllKeywordsForProduct(
      req.params.productId,
      req.body.keywordIds,
    );
    res.json({
      message: "Keywords updated successfully",
      keywords: updatedKeywords,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update keywords" });
  }
};

// ==================== BULK IMPORT ====================

exports.batchCreateProducts = async (req, res) => {
  try {
    const result = await bulkImport.batchCreateProducts(req.body);
    res.status(201).json({
      message: `${result.created.length} products created`,
      successCount: result.created.length,
      failedCount: result.errors.length,
      created: result.created,
      errors: result.errors,
    });
  } catch (error) {
    const payload = { message: error.message };
    if (error.errors) payload.errors = error.errors;
    res.status(error.status || 500).json(payload);
  }
};

exports.bulkImportProducts = async (req, res) => {
  try {
    const result = await bulkImport.bulkImportProducts(req.body.products);
    res.status(201).json({
      success: true,
      message: `${result.created.length} products created`,
      created: result.created,
      failed: result.failed,
      newCategories: result.newCategories,
      newBrands: result.newBrands,
      newVendors: result.newVendors,
      totalProcessed: req.body.products.length,
      successCount: result.created.length,
      failedCount: result.failed.length,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: "Bulk import failed",
      error: error.message,
    });
  }
};

// Exposed so the background import worker can reuse the same batch logic.
exports.processProductBatch = bulkImport.processProductBatch;

// ==================== SALES / REPORTING ====================

exports.getTopSellingProducts = async (req, res) => {
  try {
    const result = await sales.getTopSellingProducts(
      parseInt(req.query.limit) || 10,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch top selling products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
