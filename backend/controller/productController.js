const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const { Op } = require("sequelize");
const { InventoryHistory } = require("../models/history");

// Create a product with meta data
exports.createProduct = async (req, res) => {
  try {
    const { meta, ...productData } = req.body;

    // Validate meta data if provided
    if (meta) {
      for (const metaId of Object.keys(meta)) {
        const metaField = await ProductMeta.findByPk(metaId);
        if (!metaField) {
          return res
            .status(400)
            .json({ message: `Invalid ProductMeta ID: ${metaId}` });
        }
        // Validate meta value based on fieldType (e.g., number, string)
        if (metaField.fieldType === "number" && isNaN(meta[metaId])) {
          return res
            .status(400)
            .json({ message: `Value for ${metaField.title} must be a number` });
        }
      }
    }

    const product = await Product.create({ ...productData, meta });
    return res
      .status(201)
      .json({ message: "Product created successfully", product });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

// Get all products with their meta data
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    const productMetaIds = [
      ...new Set(
        products.filter((p) => p.meta).flatMap((p) => Object.keys(p.meta))
      ),
    ];
    const productMetas = await ProductMeta.findAll({
      where: { id: { [Op.in]: productMetaIds } },
      attributes: ["id", "title", "slug", "fieldType", "unit"],
    });

    const enrichedProducts = products.map((product) => {
      const productData = product.toJSON();
      if (productData.meta) {
        productData.metaDetails = Object.keys(productData.meta).map(
          (metaId) => {
            const metaField = productMetas.find((mf) => mf.id === metaId);
            return {
              id: metaId,
              title: metaField ? metaField.title : "Unknown",
              slug: metaField ? metaField.slug : null,
              value: productData.meta[metaId],
              fieldType: metaField ? metaField.fieldType : null,
              unit: metaField ? metaField.unit : null,
            };
          }
        );
      }
      return productData;
    });

    return res.status(200).json(enrichedProducts);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// Get a single product by ID with meta data
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    const metaIds = Object.keys(product.meta || {});
    const metas = await ProductMeta.findAll({
      where: { id: { [Op.in]: metaIds } },
      attributes: ["id", "title", "slug", "fieldType", "unit"],
    });

    const productData = product.toJSON();
    productData.metaDetails = metaIds.map((id) => {
      const field = metas.find((m) => m.id === id);
      return {
        id,
        title: field?.title || "Unknown",
        slug: field?.slug || null,
        value: productData.meta[id],
        fieldType: field?.fieldType || null,
        unit: field?.unit || null,
      };
    });

    return res.status(200).json(productData);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const products = await Product.findAll({
      where: { categoryId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: ProductMeta,
          as: "product_metas",
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        },
      ],
    });

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this category." });
    }

    const enrichedProducts = products.map((product) => {
      const productData = product.toJSON();
      if (productData.meta) {
        productData.metaDetails = Object.keys(productData.meta).map(
          (metaId) => {
            const metaField = productData.product_metas.find(
              (mf) => mf.id === metaId
            );
            return {
              id: metaId,
              title: metaField ? metaField.title : "Unknown",
              slug: metaField ? metaField.slug : null,
              value: productData.meta[metaId],
              fieldType: metaField ? metaField.fieldType : null,
              unit: metaField ? metaField.unit : null,
            };
          }
        );
      }
      delete productData.product_metas;
      return productData;
    });

    res.status(200).json(enrichedProducts);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Update a product with meta data
exports.updateProduct = async (req, res) => {
  try {
    const { meta, ...productData } = req.body;
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate meta data if provided
    if (meta) {
      for (const metaId of Object.keys(meta)) {
        const metaField = await ProductMeta.findByPk(metaId);
        if (!metaField) {
          return res
            .status(400)
            .json({ message: `Invalid ProductMeta ID: ${metaId}` });
        }
        if (metaField.fieldType === "number" && isNaN(meta[metaId])) {
          return res
            .status(400)
            .json({ message: `Value for ${metaField.title} must be a number` });
        }
      }
    }

    await product.update({ ...productData, meta });
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

// Add stock to a product
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

    const historyEntry = await InventoryHistory.findOneAndUpdate(
      { productId: productId.toString() },
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

    const historyEntry = await InventoryHistory.findOneAndUpdate(
      { productId: productId.toString() },
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
    const threshold = req.query.threshold || 10;
    const products = await Product.findAll({
      where: {
        quantity: { [Op.lte]: threshold },
      },
      attributes: ["productId", "name", "quantity"],
      include: [
        {
          model: ProductMeta,
          as: "product_metas",
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        },
      ],
    });

    const enrichedProducts = products.map((product) => {
      const productData = product.toJSON();
      if (productData.meta) {
        productData.metaDetails = Object.keys(productData.meta).map(
          (metaId) => {
            const metaField = productData.product_metas.find(
              (mf) => mf.id === metaId
            );
            return {
              id: metaId,
              title: metaField ? metaField.title : "Unknown",
              slug: metaField ? metaField.slug : null,
              value: productData.meta[metaId],
              fieldType: metaField ? metaField.fieldType : null,
              unit: metaField ? metaField.unit : null,
            };
          }
        );
      }
      delete productData.product_metas;
      return productData;
    });

    return res.status(200).json({
      message: `${products.length} product(s) with low stock`,
      products: enrichedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};

// Get inventory history for a specific product
exports.getHistoryByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const historyEntry = await InventoryHistory.findOne({
      productId: productId.toString(),
    });

    if (!historyEntry || historyEntry.history.length === 0) {
      return res.status(200).json({
        message: "No history found for this product",
        history: [],
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

// Search products with meta data
exports.searchProducts = async (req, res) => {
  try {
    const {
      query,
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

    if (query) {
      filters[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { product_code: { [Op.iLike]: `%${query}%` } },
        { brandId: { [Op.eq]: query } },
        { categoryId: { [Op.eq]: query } },
      ];
    }

    if (name) {
      filters.name = { [Op.iLike]: `%${name}%` };
    }
    if (sellingPrice) {
      filters["$meta.sellingPrice$"] = { [Op.eq]: Number(sellingPrice) };
    }
    if (minSellingPrice) {
      filters["$meta.sellingPrice$"] = {
        ...filters["$meta.sellingPrice$"],
        [Op.gte]: Number(minSellingPrice),
      };
    }
    if (maxSellingPrice) {
      filters["$meta.sellingPrice$"] = {
        ...filters["$meta.sellingPrice$"],
        [Op.lte]: Number(maxSellingPrice),
      };
    }
    if (purchasingPrice) {
      filters["$meta.purchasingPrice$"] = { [Op.eq]: Number(purchasingPrice) };
    }
    if (minPurchasingPrice) {
      filters["$meta.purchasingPrice$"] = {
        ...filters["$meta.purchasingPrice$"],
        [Op.gte]: Number(minPurchasingPrice),
      };
    }
    if (maxPurchasingPrice) {
      filters["$meta.purchasingPrice$"] = {
        ...filters["$meta.purchasingPrice$"],
        [Op.lte]: Number(maxPurchasingPrice),
      };
    }
    if (companyCode) {
      filters.companyCode = companyCode;
    }
    if (productCode) {
      filters.product_code = productCode;
    }
    if (brandId) {
      filters.brandId = brandId;
    }
    if (categoryId) {
      filters.categoryId = categoryId;
    }

    const products = await Product.findAll({
      where: filters,
      include: [
        {
          model: ProductMeta,
          as: "product_metas",
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        },
      ],
    });

    const enrichedProducts = products.map((product) => {
      const productData = product.toJSON();
      if (productData.meta) {
        productData.metaDetails = Object.keys(productData.meta).map(
          (metaId) => {
            const metaField = productData.product_metas.find(
              (mf) => mf.id === metaId
            );
            return {
              id: metaId,
              title: metaField ? metaField.title : "Unknown",
              slug: metaField ? metaField.slug : null,
              value: productData.meta[metaId],
              fieldType: metaField ? metaField.fieldType : null,
              unit: metaField ? metaField.unit : null,
            };
          }
        );
      }
      delete productData.product_metas;
      return productData;
    });

    return res.status(200).json(enrichedProducts);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};

// Get all product codes
exports.getAllProductCodes = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ["productId", "product_code", "name", "categoryId"],
      include: [
        {
          model: ProductMeta,
          as: "product_metas",
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        },
      ],
    });

    const enrichedProducts = products.map((product) => {
      const productData = product.toJSON();
      if (productData.meta) {
        productData.metaDetails = Object.keys(productData.meta).map(
          (metaId) => {
            const metaField = productData.product_metas.find(
              (mf) => mf.id === metaId
            );
            return {
              id: metaId,
              title: metaField ? metaField.title : "Unknown",
              slug: metaField ? metaField.slug : null,
              value: productData.meta[metaId],
              fieldType: metaField ? metaField.fieldType : null,
              unit: metaField ? metaField.unit : null,
            };
          }
        );
      }
      delete productData.product_metas;
      return productData;
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: enrichedProducts,
    });
  } catch (error) {
    console.error("Error fetching product codes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update isFeatured status of a product
exports.updateProductFeatured = async (req, res) => {
  const { productId } = req.params;
  const { isFeatured } = req.body;

  try {
    if (typeof isFeatured !== "boolean") {
      return res.status(400).json({ message: "isFeatured must be a boolean" });
    }

    const product = await Product.findOne({ where: { productId } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isFeatured = isFeatured;
    await product.save();

    return res.status(200).json({
      message: "Product featured status updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product featured status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
