const Product = require("../models/product");
const { Op } = require("sequelize");

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

// Add stock to a product
exports.addStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.quantity += quantity;
    await product.save();
    return res
      .status(200)
      .json({ message: "Stock added successfully", product });
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
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }
    product.quantity -= quantity;
    await product.save();
    return res
      .status(200)
      .json({ message: "Stock removed successfully", product });
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
      where: { quantity: { [Op.lte]: threshold } },
    });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};
