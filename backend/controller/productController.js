const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
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
// Add stock to a product (NOW USING MYSQL + TRANSACTION)
// ─────────────────────────────────────────────────────────────────────────────
exports.addStock = async (req, res) => {
  const { productId } = req.params;
  const { quantity, orderNo, userId, message: customMessage } = req.body;

  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }

  const qty = Number(quantity);

  try {
    const result = await sequelize.transaction(async (t) => {
      const product = await Product.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!product) throw new Error("Product not found");

      const newQuantity = product.quantity + qty;
      await product.update({ quantity: newQuantity }, { transaction: t });

      let username = "unknown";
      if (userId) {
        const user = await User.findByPk(userId, {
          attributes: ["username"],
          transaction: t,
        });
        if (user) username = user.username;
      }

      const finalMessage =
        customMessage?.trim() ||
        `Stock added by ${username}${orderNo ? ` (Order #${orderNo})` : ""}`;

      const history = await InventoryHistory.create(
        {
          productId,
          change: qty,
          quantityAfter: newQuantity,
          action: "add-stock",
          orderNo: orderNo || null,
          userId: userId || null,
          message: finalMessage,
        },
        { transaction: t }
      );

      return { product, history };
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
    res.status(500).json({ message: error.message || "Error adding stock" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Remove stock from a product (NOW USING MYSQL + TRANSACTION)
// ─────────────────────────────────────────────────────────────────────────────
exports.removeStock = async (req, res) => {
  const { productId } = req.params;
  const { quantity, orderNo, userId, message: customMessage } = req.body;

  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }

  const qty = Number(quantity);

  try {
    const result = await sequelize.transaction(async (t) => {
      const product = await Product.findByPk(productId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!product) throw new Error("Product not found");
      if (product.quantity < qty) throw new Error("Insufficient stock");

      const newQuantity = product.quantity - qty;
      await product.update({ quantity: newQuantity }, { transaction: t });

      let username = "unknown";
      if (userId) {
        const user = await User.findByPk(userId, {
          attributes: ["username"],
          transaction: t,
        });
        if (user) username = user.username;
      }

      const finalMessage =
        customMessage?.trim() ||
        `Stock removed by ${username}${orderNo ? ` (Order #${orderNo})` : ""}`;

      const history = await InventoryHistory.create(
        {
          productId,
          change: -qty,
          quantityAfter: newQuantity,
          action: "remove-stock",
          orderNo: orderNo || null,
          userId: userId || null,
          message: finalMessage,
        },
        { transaction: t }
      );

      return { product, history };
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
    const status = error.message === "Insufficient stock" ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get inventory history for a specific product (NOW FROM MYSQL)
// ─────────────────────────────────────────────────────────────────────────────
exports.getHistoryByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await InventoryHistory.findAndCountAll({
      where: { productId },
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      attributes: [
        "id",
        "change",
        "quantityAfter",
        "action",
        "orderNo",
        "userId",
        "message",
        "createdAt",
      ],
    });

    res.json({
      message: "Inventory history retrieved successfully",
      total: count,
      page,
      pages: Math.ceil(count / limit),
      history: rows.map((h) => ({
        id: h.id,
        change: h.change,
        quantityAfter: h.quantityAfter,
        action: h.action,
        orderNo: h.orderNo,
        userId: h.userId,
        message: h.message,
        timestamp: h.createdAt,
      })),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving history", error: error.message });
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

exports.batchCreateProducts = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      categoryId,
      brandId,
      vendorId,
      brand_parentcategoriesId,
      products, // array of { name, product_code, quantity, price, meta: { "1": "8GB", "2": "256GB" } }
    } = req.body;

    if (
      !Array.isArray(products) ||
      products.length === 0 ||
      products.length > 50
    ) {
      return res.status(400).json({ message: "Send 1–50 products" });
    }

    // Validate common fields
    if (!categoryId || !brandId) {
      return res
        .status(400)
        .json({ message: "categoryId and brandId required" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const index = i + 1;

      if (!p.name?.trim() || !p.product_code?.trim()) {
        errors.push(`Row ${index}: Name and Code required`);
        continue;
      }

      try {
        const product = await Product.create(
          {
            name: p.name.trim(),
            product_code: p.product_code.trim(),
            quantity: parseInt(p.quantity) || 0,
            price: parseFloat(p.price) || 0,
            categoryId,
            brandId,
            vendorId: vendorId || null,
            brand_parentcategoriesId: brand_parentcategoriesId || null,
            description: p.description?.trim() || null,
            meta: p.meta && Object.keys(p.meta).length ? p.meta : null,
            images: "[]", // or allow bulk image later
            status: "active",
            isFeatured: false,
          },
          { transaction: t }
        );

        results.push({
          row: index,
          productId: product.productId,
          name: product.name,
          product_code: product.product_code,
          status: "success",
        });
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
          errors.push(`Row ${index}: Code ${p.product_code} already exists`);
        } else {
          errors.push(`Row ${index}: ${err.message}`);
        }
      }
    }

    if (errors.length > 0 && results.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "All failed", errors });
    }

    if (results.length > 0) {
      await t.commit();
    } else {
      await t.rollback();
    }

    return res.status(201).json({
      message: `${results.length} products created`,
      successCount: results.length,
      failedCount: errors.length,
      created: results,
      errors,
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

exports.checkproductCode = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res
        .status(400)
        .json({ exists: false, message: "Code is required" });
    }

    // Case-insensitive check (optional, but recommended for consistency)
    const existing = await Product.findOne({
      where: {
        product_code: code.trim(),
      },
      attributes: ["product_code"], // only fetch the code, minimal data
    });

    res.json({ exists: !!existing });
  } catch (error) {
    console.error("Error checking product code:", error);
    res.status(500).json({ exists: false, error: "Server error" });
  }
};
