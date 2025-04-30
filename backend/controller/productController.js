const Product = require("../models/product");
const { Op } = require("sequelize");
const { InventoryHistory } = require("../models/history");
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res
      .status(201)
      .json({ message: "Product created successfully", product });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    return res.status(200).json(products);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.update(req.body);
    return res
      .status(200)
      .json({ message: "Product updated successfully", product });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.destroy();
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

// Inventory Management Features

exports.addStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ message: "Invalid quantity value" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.quantity += Number(quantity);
    await product.save();

    // ✅ Update or create inventory history in MongoDB
    const historyEntry = await InventoryHistory.findOneAndUpdate(
      { productId: productId.toString() }, // ✅ Ensure productId is a string
      {
        $push: {
          history: {
            quantity: Number(quantity),
            action: "add-stock",
            timestamp: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Stock added successfully",
      product,
      history: historyEntry,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding stock", error: error.message });
  }
};

// Remove stock from a product
exports.removeStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ message: "Invalid quantity value" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    product.quantity -= Number(quantity);
    await product.save();

    // ✅ Update or create inventory history in MongoDB
    const historyEntry = await InventoryHistory.findOneAndUpdate(
      { productId: productId.toString() }, // ✅ Ensure productId is a string
      {
        $push: {
          history: {
            quantity: Number(quantity),
            action: "remove-stock",
            timestamp: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Stock removed successfully",
      product,
      history: historyEntry,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error removing stock", error: error.message });
  }
};

// Get low-stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = req.query.threshold || 10; // Default low stock threshold
    const products = await Product.findAll({
      where: {
        quantity: { [Op.lte]: threshold },
      },
      attributes: ["productId", "name", "quantity"],
    });
    return res.status(200).json({
      message: `${products.length} product(s) with low stock`,
      products: products,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};

// Function to log stock changes
exports.updateInventoryHistory = async (productId, quantity, action) => {
  try {
    let historyEntry = await InventoryHistory.findOne({ productId });

    if (!historyEntry) {
      // If no history exists, create a new one
      historyEntry = new InventoryHistory({ productId, history: [] });
    }

    // Push new history record
    historyEntry.history.push({ quantity, action });

    await historyEntry.save();
  } catch (error) {
    console.error("Error updating inventory history:", error);
  }
};

// Get inventory history for a specific product
exports.getHistoryByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const historyEntry = await InventoryHistory.findOne({
      productId: productId.toString(),
    });

    // Fix: Return an empty array instead of a 404 error
    if (!historyEntry || historyEntry.history.length === 0) {
      return res.status(200).json({
        message: "No history found for this product",
        history: [], // Return an empty array instead of a 404
      });
    }

    return res.status(200).json({
      message: "Inventory history retrieved successfully",
      history: historyEntry.history,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving inventory history",
      error: error.message,
    });
  }
};

// Search products with

exports.searchProducts = async (req, res) => {
  try {
    const {
      query, // General search term (searches across all fields)
      name,
      sellingPrice,
      minSellingPrice,
      maxSellingPrice,
      purchasingPrice,
      minPurchasingPrice,
      maxPurchasingPrice,
      companyCode,
      productCode,
      brandId,
      categoryId,
    } = req.query;

    const filters = {};

    // 🔍 General Search (Search in all relevant fields)
    if (query) {
      filters[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { companyCode: { [Op.iLike]: `%${query}%` } },
        { productCode: { [Op.iLike]: `%${query}%` } },
        { brandId: { [Op.eq]: query } },
        { categoryId: { [Op.eq]: query } },
      ];
    }

    // 🔍 Specific Field Search (Only applied if explicitly given)
    if (name) {
      filters.name = { [Op.iLike]: `%${name}%` };
    }
    if (sellingPrice) {
      filters.sellingPrice = { [Op.eq]: Number(sellingPrice) };
    }
    if (minSellingPrice) {
      filters.sellingPrice = {
        ...filters.sellingPrice,
        [Op.gte]: Number(minSellingPrice),
      };
    }
    if (maxSellingPrice) {
      filters.sellingPrice = {
        ...filters.sellingPrice,
        [Op.lte]: Number(maxSellingPrice),
      };
    }
    if (purchasingPrice) {
      filters.purchasingPrice = { [Op.eq]: Number(purchasingPrice) };
    }
    if (minPurchasingPrice) {
      filters.purchasingPrice = {
        ...filters.purchasingPrice,
        [Op.gte]: Number(minPurchasingPrice),
      };
    }
    if (maxPurchasingPrice) {
      filters.purchasingPrice = {
        ...filters.purchasingPrice,
        [Op.lte]: Number(maxPurchasingPrice),
      };
    }
    if (companyCode) {
      filters.companyCode = companyCode;
    }
    if (productCode) {
      filters.productCode = productCode;
    }
    if (brandId) {
      filters.brandId = brandId;
    }
    if (categoryId) {
      filters.categoryId = categoryId;
    }

    const products = await Product.findAll({ where: filters });

    return res.status(200).json(products);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};
// ✅ Get all products that are low in stock (quantity <= threshold)
exports.getAllLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5; // Default threshold is 5
    const lowStockProducts = await Product.findAll({
      where: {
        quantity: { [Op.lte]: threshold },
      },
      attributes: ["productId", "name", "quantity"], // Return only necessary fields
    });

    return res.status(200).json({
      message: `${lowStockProducts.length} product(s) with low stock`,
      products: lowStockProducts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};
exports.getAllProductCodes = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ["productId", "product_code", "name", "categoryId"],
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching product codes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
