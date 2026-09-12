const productService = require("./product.service");

// Helper to send consistent error responses
const handleError = (res, error) => {
  const status = error.status || 500;
  const payload = { message: error.message || "Internal server error" };
  if (error.error) payload.error = error.error;
  if (error.errors) payload.errors = error.errors;
  if (error.exists !== undefined) payload.exists = error.exists;
  if (error.success !== undefined) payload.success = error.success;
  return res.status(status).json(payload);
};

// ==================== CREATE PRODUCT ====================
exports.createProduct = async (req, res) => {
  try {
    const result = await productService.createProduct(req);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// ==================== UPDATE PRODUCT ====================
exports.updateProduct = async (req, res) => {
  try {
    const result = await productService.updateProduct(req);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// ==================== GET ALL PRODUCTS ====================
exports.getAllProducts = async (req, res) => {
  try {
    const result = await productService.getAllProducts(req);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==================== GET SINGLE PRODUCT ====================
exports.getProductById = async (req, res) => {
  try {
    const result = await productService.getProductById(req);
    return res.json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error fetching product" });
  }
};

// ==================== DELETE PRODUCT ====================
exports.deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(req);
    return res.json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error deleting product" });
  }
};

// ==================== GET PRODUCTS BY CATEGORY ====================
exports.getProductsByCategory = async (req, res) => {
  try {
    const result = await productService.getProductsByCategory(req);
    return res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Failed to fetch products by category",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==================== GET PRODUCTS BY BRAND ====================
exports.getProductsByBrand = async (req, res) => {
  try {
    const result = await productService.getProductsByBrand(req);
    return res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Failed to fetch products by brand",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==================== ADD STOCK ====================
exports.addStock = async (req, res) => {
  try {
    const result = await productService.addStock(req);
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Error adding stock",
    });
  }
};

// ==================== REMOVE STOCK ====================
exports.removeStock = async (req, res) => {
  try {
    const result = await productService.removeStock(req);
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// ==================== GET HISTORY BY PRODUCT ID ====================
exports.getHistoryByProductId = async (req, res) => {
  try {
    const result = await productService.getHistoryByProductId(req);
    return res.json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving history", error: error.message });
  }
};

// ==================== GET LOW STOCK PRODUCTS ====================
// Note: Original file had two implementations with the same name.
// The controller keeps the name `getLowStockProducts` and uses the richer V2 by default.
// You can switch to the first version by calling productService.getLowStockProducts instead.
exports.getLowStockProducts = async (req, res) => {
  try {
    // Prefer the more detailed second implementation
    const result = await productService.getLowStockProductsV2(req);
    return res.json(result);
  } catch (error) {
    console.error("Low Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch low stock products",
    });
  }
};

// ==================== SEARCH PRODUCTS ====================
exports.searchProducts = async (req, res) => {
  try {
    const result = await productService.searchProducts(req);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Error searching products",
      error: error.message,
    });
  }
};

// ==================== GET ALL PRODUCT CODES ====================
exports.getAllProductCodes = async (req, res) => {
  try {
    const result = await productService.getAllProductCodes();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==================== UPDATE FEATURED STATUS ====================
exports.updateProductFeatured = async (req, res) => {
  try {
    const result = await productService.updateProductFeatured(req);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

// ==================== GET PRODUCTS BY IDS ====================
exports.getProductsByIds = async (req, res) => {
  try {
    const result = await productService.getProductsByIds(req);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Failed to fetch products by IDs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ==================== GET ALL PRODUCT CODES BRAND-WISE ====================
exports.getAllProductCodesBrandWise = async (req, res) => {
  try {
    const result = await productService.getAllProductCodesBrandWise();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product codes",
      error: error.message,
    });
  }
};

// ==================== BATCH CREATE PRODUCTS ====================
exports.batchCreateProducts = async (req, res) => {
  try {
    const result = await productService.batchCreateProducts(req);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// ==================== CHECK PRODUCT CODE ====================
exports.checkproductCode = async (req, res) => {
  try {
    const result = await productService.checkproductCode(req);
    return res.json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ exists: false, message: error.message });
    }
    return res.status(500).json({ exists: false, error: "Server error" });
  }
};

// ==================== GET PRODUCT WITH VARIANTS ====================
exports.getProductWithVariants = async (req, res) => {
  try {
    const result = await productService.getProductWithVariants(req);
    return res.json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

// ==================== CREATE VARIANT ====================
exports.createVariant = async (req, res) => {
  try {
    const result = await productService.createVariant(req);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// ==================== ADD KEYWORDS TO PRODUCT ====================
exports.addKeywordsToProduct = async (req, res) => {
  try {
    const result = await productService.addKeywordsToProduct(req);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// ==================== REMOVE KEYWORD FROM PRODUCT ====================
exports.removeKeywordFromProduct = async (req, res) => {
  try {
    const result = await productService.removeKeywordFromProduct(req);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// ==================== REMOVE ALL KEYWORDS FROM PRODUCT ====================
exports.removeAllKeywordsFromProduct = async (req, res) => {
  try {
    const result = await productService.removeAllKeywordsFromProduct(req);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ==================== REPLACE ALL KEYWORDS FOR PRODUCT ====================
exports.replaceAllKeywordsForProduct = async (req, res) => {
  try {
    const result = await productService.replaceAllKeywordsForProduct(req);
    return res.json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// ==================== GET PRODUCT COUNT ====================
exports.getProductCount = async (req, res) => {
  try {
    const result = await productService.getProductCount();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product count",
    });
  }
};

// ==================== GET TOP SELLING PRODUCTS ====================
exports.getTopSellingProducts = async (req, res) => {
  try {
    const result = await productService.getTopSellingProducts(req);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch top selling products",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// ==================== BULK IMPORT PRODUCTS ====================
exports.bulkImportProducts = async (req, res) => {
  try {
    const result = await productService.bulkImportProducts(req);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// ==================== BULK INVENTORY UPDATE ====================
exports.bulkInventoryUpdate = async (req, res) => {
  try {
    const result = await productService.bulkInventoryUpdate(req);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// Export the reusable batch function so worker can use it
exports.processProductBatch = productService.processProductBatch;
