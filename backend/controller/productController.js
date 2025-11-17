const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const { Op } = require("sequelize");
const InventoryHistory = require("../models/history"); // Mongoose model (exported directly)
const Brand = require("../models/brand");
const User = require("../models/users");
// ─────────────────────────────────────────────────────────────────────────────
// Create a product with meta data
// ─────────────────────────────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const { meta, ...productData } = req.body;
    const metaObj = meta ? JSON.parse(meta) : {};

    // ---- validate meta (same as before) ----
    for (const id of Object.keys(metaObj)) {
      const m = await ProductMeta.findByPk(id);
      if (!m) return res.status(400).json({ message: `Invalid meta ID ${id}` });
      if (m.fieldType === "number" && isNaN(metaObj[id]))
        return res.status(400).json({ message: `${m.title} must be a number` });
    }

    // ---- upload new images ----
    const imageUrls = [];
    if (req.files) {
      for (const f of req.files) {
        const url = await uploadToFtp(f.buffer, f.originalname);
        imageUrls.push(url);
      }
    }

    const product = await Product.create({
      ...productData,
      meta: Object.keys(metaObj).length ? metaObj : null,
      images: JSON.stringify(imageUrls),
      isFeatured: productData.isFeatured === "true",
    });

    res.status(201).json({ message: "Product created", product });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// Get all products with their meta data
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();

    // 1. Collect every meta-key that appears in any product
    const metaKeySet = new Set();
    products.forEach((p) => {
      if (p.meta) {
        try {
          const obj = typeof p.meta === "string" ? JSON.parse(p.meta) : p.meta;
          Object.keys(obj).forEach((k) => metaKeySet.add(k));
        } catch (_) {}
      }
    });

    // 2. Pull the meta definitions once
    const productMetas = await ProductMeta.findAll({
      where: { id: { [Op.in]: [...metaKeySet] } },
      attributes: ["id", "title", "slug", "fieldType", "unit"],
    });

    // 3. Enrich each product
    const enriched = products.map((p) => {
      const raw = p.toJSON();

      // ---- images → array -------------------------------------------------
      let images = [];
      if (raw.images) {
        try {
          images =
            typeof raw.images === "string"
              ? JSON.parse(raw.images)
              : Array.isArray(raw.images)
              ? raw.images
              : [];
        } catch (_) {}
      }

      // ---- meta → object --------------------------------------------------
      let metaObj = {};
      if (raw.meta) {
        try {
          metaObj =
            typeof raw.meta === "string" ? JSON.parse(raw.meta) : raw.meta;
        } catch (_) {}
      }

      // ---- metaDetails ----------------------------------------------------
      const metaDetails = Object.entries(metaObj).map(([id, value]) => {
        const def = productMetas.find((m) => m.id === id);
        return {
          id,
          title: def?.title ?? "Unknown",
          slug: def?.slug ?? null,
          value: String(value),
          fieldType: def?.fieldType ?? null,
          unit: def?.unit ?? null,
        };
      });

      return {
        ...raw,
        images, // ← array
        meta: metaObj, // ← plain object
        metaDetails,
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    res
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

    const raw = product.toJSON();

    // ---- images -----------------------------------------------------------
    let images = [];
    if (raw.images) {
      try {
        images =
          typeof raw.images === "string"
            ? JSON.parse(raw.images)
            : Array.isArray(raw.images)
            ? raw.images
            : [];
      } catch (_) {}
    }

    // ---- meta -------------------------------------------------------------
    let metaObj = {};
    if (raw.meta) {
      try {
        metaObj =
          typeof raw.meta === "string" ? JSON.parse(raw.meta) : raw.meta;
      } catch (_) {}
    }

    // ---- fetch meta definitions for the keys that exist -----------------
    const metaIds = Object.keys(metaObj);
    const metas = await ProductMeta.findAll({
      where: { id: { [Op.in]: metaIds } },
      attributes: ["id", "title", "slug", "fieldType", "unit"],
    });

    const metaDetails = metaIds.map((id) => {
      const def = metas.find((m) => m.id === id);
      return {
        id,
        title: def?.title ?? "Unknown",
        slug: def?.slug ?? null,
        value: String(metaObj[id]),
        fieldType: def?.fieldType ?? null,
        unit: def?.unit ?? null,
      };
    });

    res.status(200).json({
      ...raw,
      images, // ← array
      meta: metaObj, // ← plain object
      metaDetails,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update a product with meta data
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ message: "Not found" });

    const { meta, imagesToDelete, ...data } = req.body;
    const metaObj = meta ? JSON.parse(meta) : {};
    const deleteList = imagesToDelete ? JSON.parse(imagesToDelete) : [];

    // ---- Validate meta ----------------------------------------------------
    for (const id of Object.keys(metaObj)) {
      const m = await ProductMeta.findByPk(id);
      if (!m) return res.status(400).json({ message: `Invalid meta ID ${id}` });
      if (m.fieldType === "number" && isNaN(metaObj[id]))
        return res.status(400).json({ message: `${m.title} must be a number` });
    }

    // ---- Current images ---------------------------------------------------
    let current = [];
    if (product.images) {
      try {
        current = JSON.parse(product.images);
      } catch (_) {}
    }

    // ---- Remove deleted ---------------------------------------------------
    if (Array.isArray(deleteList)) {
      current = current.filter((url) => !deleteList.includes(url));
    }

    // ---- Upload new -------------------------------------------------------
    if (req.files) {
      for (const f of req.files) {
        const url = await uploadToFtp(f.buffer, f.originalname);
        current.push(url);
      }
    }

    // ---- Clean incoming data ---------------------------------------------
    const cleanData = {
      name: data.name?.trim(),
      product_code: data.product_code?.trim(),
      quantity: data.quantity ? parseInt(data.quantity, 10) : undefined,
      alert_quantity: data.alert_quantity
        ? parseInt(data.alert_quantity, 10)
        : undefined,
      tax: data.tax ? parseFloat(data.tax) : undefined,
      description: data.description?.trim() || null,
      isFeatured: data.isFeatured === "true",
      categoryId: data.categoryId || null,
      brandId: data.brandId || null,
      vendorId: data.vendorId || null,
      brand_parentcategoriesId: data.brand_parentcategoriesId || null,
    };

    const updateFields = Object.fromEntries(
      Object.entries(cleanData).filter(([, v]) => v !== undefined)
    );

    // ---- Store JSON fields ------------------------------------------------
    const finalMeta = Object.keys(metaObj).length
      ? JSON.stringify(metaObj)
      : product.meta;
    const finalImages = JSON.stringify(current);

    product.set({
      ...updateFields,
      meta: finalMeta,
      images: finalImages,
    });

    // force updatedAt if nothing else changed
    const changed = product.changed();
    if (!changed || changed.length === 0) product.changed("updatedAt", true);

    await product.save();

    // ---- Return the SAME shape the UI expects ----------------------------
    const saved = product.toJSON();

    let imagesArr = [];
    try {
      imagesArr = JSON.parse(saved.images);
    } catch (_) {}

    let metaObjOut = {};
    try {
      metaObjOut = JSON.parse(saved.meta || "{}");
    } catch (_) {}

    const metaIds = Object.keys(metaObjOut);
    const metas = await ProductMeta.findAll({
      where: { id: { [Op.in]: metaIds } },
      attributes: ["id", "title", "slug", "fieldType", "unit"],
    });

    const metaDetails = metaIds.map((id) => {
      const def = metas.find((m) => m.id === id);
      return {
        id,
        title: def?.title ?? "Unknown",
        slug: def?.slug ?? null,
        value: String(metaObjOut[id]),
        fieldType: def?.fieldType ?? null,
        unit: def?.unit ?? null,
      };
    });

    res.json({
      message: "Product updated",
      product: {
        ...saved,
        images: imagesArr,
        meta: metaObjOut,
        metaDetails,
      },
    });
  } catch (e) {
    console.error("Update error:", e);
    res.status(500).json({ message: e.message });
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
      productData.metaDetails = [];

      if (
        productData.meta &&
        typeof productData.meta === "object" &&
        productData.product_metas &&
        Array.isArray(productData.product_metas)
      ) {
        productData.metaDetails = Object.keys(productData.meta).map(
          (metaId) => {
            const id = parseInt(metaId, 10);
            const metaField = productData.product_metas.find(
              (mf) => mf.id === id
            );

            return {
              id: metaId,
              title: metaField?.title ?? "Unknown",
              slug: metaField?.slug ?? null,
              value: productData.meta[metaId],
              fieldType: metaField?.fieldType ?? null,
              unit: metaField?.unit ?? null,
            };
          }
        );
      }

      delete productData.product_metas;
      delete productData.meta;
      return productData;
    });

    res.status(200).json(enrichedProducts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error." });
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
    const { quantity, orderNo, userId, message: customMessage } = req.body;

    if (isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ message: "Invalid quantity value" });
    }

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.quantity += Number(quantity);
    await product.save();

    let finalMessage = customMessage?.trim();
    let username = "unknown";

    // Fetch user to get username
    if (userId) {
      const user = await User.findByPk(userId, { attributes: ["username"] });
      if (user) username = user.username;
    }

    // Auto-generate message if not provided
    if (!finalMessage) {
      finalMessage = `Stock added by ${username}`;
      if (orderNo) finalMessage += ` (Order #${orderNo})`;
    }

    let historyEntry = null;

    try {
      const result = await InventoryHistory.findOneAndUpdate(
        { productId },
        {
          $push: {
            history: {
              quantity: Number(quantity),
              action: "add-stock",
              timestamp: new Date(),
              orderNo: orderNo ? Number(orderNo) : undefined,
              userId: userId || undefined,
              message: finalMessage,
            },
          },
        },
        { upsert: true, new: true }
      );

      historyEntry = result.history[result.history.length - 1];
    } catch (mongoErr) {
      console.error("Failed to log add-stock history:", mongoErr);
    }

    return res.status(200).json({
      message: "Stock added successfully",
      product,
      inventoryHistory: historyEntry
        ? {
            _id: historyEntry._id,
            action: historyEntry.action,
            quantity: historyEntry.quantity,
            timestamp: historyEntry.timestamp,
            orderNo: historyEntry.orderNo,
            userId: historyEntry.userId,
            message: historyEntry.message,
          }
        : null,
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
    const { quantity, orderNo, userId, message: customMessage } = req.body;

    if (isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ message: "Invalid quantity value" });
    }

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    product.quantity -= Number(quantity);
    await product.save();

    let finalMessage = customMessage?.trim();
    let username = "unknown";

    // Fetch user to get username
    if (userId) {
      const user = await User.findByPk(userId, { attributes: ["username"] });
      if (user) username = user.username;
    }

    // Auto-generate message if not provided
    if (!finalMessage) {
      finalMessage = `Stock removed by ${username}`;
      if (orderNo) finalMessage += ` (Order #${orderNo})`;
    }

    let historyEntry = null;

    try {
      const result = await InventoryHistory.findOneAndUpdate(
        { productId },
        {
          $push: {
            history: {
              quantity: -Number(quantity),
              action: "remove-stock",
              timestamp: new Date(),
              orderNo: orderNo ? Number(orderNo) : undefined,
              userId: userId || undefined,
              message: finalMessage,
            },
          },
        },
        { upsert: true, new: true }
      );

      historyEntry = result.history[result.history.length - 1];
    } catch (mongoErr) {
      console.error("Failed to log remove-stock history:", mongoErr);
    }

    return res.status(200).json({
      message: "Stock removed successfully",
      product,
      inventoryHistory: historyEntry
        ? {
            _id: historyEntry._id,
            action: historyEntry.action,
            quantity: historyEntry.quantity,
            timestamp: historyEntry.timestamp,
            orderNo: historyEntry.orderNo,
            userId: historyEntry.userId,
            message: historyEntry.message,
          }
        : null,
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
      attributes: ["productId", "product_code", "name", "categoryId", "images"],
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
      attributes: ["product_code", "brandId"],
      where: { status: "active" },
      raw: true,
    });

    // Group by brandId
    const grouped = products.reduce((acc, p) => {
      const brandId = p.brandId || "unknown";
      if (!acc[brandId]) acc[brandId] = [];
      acc[brandId].push(p.product_code);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      count: products.length,
      data: grouped,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product codes",
      error: error.message,
    });
  }
};
