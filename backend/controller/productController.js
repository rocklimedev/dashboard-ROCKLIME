const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const { Op } = require("sequelize");
const InventoryHistory = require("../models/history"); // Mongoose model (exported directly)

// ─────────────────────────────────────────────────────────────────────────────
// Create a product with meta data
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Get all products with their meta data
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Get a single product by ID with meta data
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Get products by category
// ─────────────────────────────────────────────────────────────────────────────
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
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update a product with meta data
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { meta, ...productData } = req.body;
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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

// ─────────────────────────────────────────────────────────────────────────────
// Delete a product
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Add stock to a product
// ─────────────────────────────────────────────────────────────────────────────
exports.addStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, orderNo, userId } = req.body; // optional

    if (isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ message: "Invalid quantity value" });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.quantity += Number(quantity);
    await product.save();

    // Log to MongoDB
    try {
      await InventoryHistory.findOneAndUpdate(
        { productId: productId },
        {
          $push: {
            history: {
              quantity: Number(quantity),
              action: "add-stock",
              timestamp: new Date(),
              orderNo: orderNo ? Number(orderNo) : undefined,
              userId: userId || undefined,
            },
          },
        },
        { upsert: true, new: true }
      );
    } catch (mongoErr) {
      console.error("Failed to log add-stock history:", mongoErr);
      // Continue — don't fail the whole request
    }

    return res.status(200).json({
      message: "Stock added successfully",
      product,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding stock", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Remove stock from a product
// ─────────────────────────────────────────────────────────────────────────────
exports.removeStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, orderNo, userId } = req.body; // optional

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

    // Log to MongoDB
    try {
      await InventoryHistory.findOneAndUpdate(
        { productId: productId },
        {
          $push: {
            history: {
              quantity: -Number(quantity),
              action: "remove-stock",
              timestamp: new Date(),
              orderNo: orderNo ? Number(orderNo) : undefined,
              userId: userId || undefined,
            },
          },
        },
        { upsert: true, new: true }
      );
    } catch (mongoErr) {
      console.error("Failed to log remove-stock history:", mongoErr);
    }

    return res.status(200).json({
      message: "Stock removed successfully",
      product,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error removing stock", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get low-stock products
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Get inventory history for a specific product
// ─────────────────────────────────────────────────────────────────────────────
exports.getHistoryByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const doc = await InventoryHistory.findOne({ productId });

    if (!doc || doc.history.length === 0) {
      return res.status(200).json({
        message: "No history found for this product",
        history: [],
      });
    }

    return res.status(200).json({
      message: "Inventory history retrieved successfully",
      history: doc.history,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving inventory history",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Search products with meta data
// ─────────────────────────────────────────────────────────────────────────────
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

    if (name) filters.name = { [Op.iLike]: `%${name}%` };
    if (sellingPrice)
      filters["$meta.sellingPrice$"] = { [Op.eq]: Number(sellingPrice) };
    if (minSellingPrice)
      filters["$meta.sellingPrice$"] = { [Op.gte]: Number(minSellingPrice) };
    if (maxSellingPrice)
      filters["$meta.sellingPrice$"] = { [Op.lte]: Number(maxSellingPrice) };
    if (purchasingPrice)
      filters["$meta.purchasingPrice$"] = { [Op.eq]: Number(purchasingPrice) };
    if (minPurchasingPrice)
      filters["$meta.purchasingPrice$"] = {
        [Op.gte]: Number(minPurchasingPrice),
      };
    if (maxPurchasingPrice)
      filters["$meta.purchasingPrice$"] = {
        [Op.lte]: Number(maxPurchasingPrice),
      };
    if (companyCode) filters.companyCode = companyCode;
    if (productCode) filters.product_code = productCode;
    if (brandId) filters.brandId = brandId;
    if (categoryId) filters.categoryId = categoryId;

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

// ─────────────────────────────────────────────────────────────────────────────
// Get all product codes
// ─────────────────────────────────────────────────────────────────────────────
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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update isFeatured status
// ─────────────────────────────────────────────────────────────────────────────
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
    return res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get products by IDs
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductsByIds = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res
        .status(400)
        .json({ message: "productIds must be a non-empty array" });
    }

    if (productIds.some((id) => !id || typeof id !== "string")) {
      return res
        .status(400)
        .json({ message: "All productIds must be non-empty strings" });
    }

    const products = await Product.findAll({
      where: {
        productId: { [Op.in]: productIds },
      },
      attributes: [
        "productId",
        "name",
        "product_code",
        "quantity",
        "discountType",
        "tax",
        "description",
        "images",
        "isFeatured",
        "brandId",
        "categoryId",
        "vendorId",
        "brand_parentcategoriesId",
        "meta",
      ],
    });

    const foundProductIds = products.map((p) => p.productId);
    const missingIds = productIds.filter((id) => !foundProductIds.includes(id));
    if (missingIds.length > 0) {
      return res.status(404).json({
        message: `Products not found for IDs: ${missingIds.join(", ")}`,
      });
    }

    return res.status(200).json({
      products: products.map((p) => p.toJSON()),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
};
/**
 * GET /products/codes/brand-wise
 * Returns: { "Brand A": ["ABC-001", "ABC-002"], "Brand B": [...] }
 */
exports.getAllProductCodesBrandWise = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: ["product_code"],
      include: [
        {
          model: Brand,
          as: "brand",
          attributes: ["name"],
          required: true, // Only products with a brand
        },
      ],
      order: [[Brand, "name", "ASC"]],
      raw: true, // Faster, flatter result
    });

    // Group by brand name
    const grouped = products.reduce((acc, p) => {
      const brandName = p["brand.name"] || "Unknown Brand";
      if (!acc[brandName]) acc[brandName] = [];
      acc[brandName].push(p.product_code);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      count: products.length,
      data: grouped,
    });
  } catch (error) {
    console.error("getAllProductCodesBrandWise error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product codes",
      error: error.message,
    });
  }
};
