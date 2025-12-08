const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const InventoryHistory = require("../models/history"); // Mongoose model (exported directly)
const Brand = require("../models/brand");
const User = require("../models/users");
const ProductKeyword = require("../models/productKeywords");
const Keyword = require("../models/keyword");
const Category = require("../models/category");
// ─────────────────────────────────────────────────────────────────────────────
// Create a product with meta data
// ─────────────────────────────────────────────────────────────────────────────
// controllers/productController.js
// controllers/productController.js

// Correct import
const { uploadToFtp } = require("../middleware/upload"); // ← this is where it really is
// controllers/productController.js

// ==================== CREATE PRODUCT ====================
// ==================== CREATE PRODUCT ====================
// ==================== CREATE PRODUCT (WITH FULL VARIANT SUPPORT) ====================
exports.createProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      name,
      product_code,
      quantity = 0,
      isMaster,
      masterProductId,
      variantOptions: variantOptionsInput,
      variantKey,
      skuSuffix,
      meta: metaInput,
      isFeatured = false,
      status,
      ...restFields
    } = req.body;

    let metaObj = {};
    if (metaInput) {
      metaObj =
        typeof metaInput === "string" ? JSON.parse(metaInput) : metaInput;
    }

    let imageUrls = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const url = await uploadToFtp(file.buffer, file.originalname);
        imageUrls.push(url);
      }
    }

    let productData = {
      name: name?.trim(),
      product_code: product_code?.trim(),
      quantity: parseInt(quantity, 10),
      images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      meta: Object.keys(metaObj).length > 0 ? metaObj : null,
      isFeatured: isFeatured === "true" || isFeatured === true,
      status: status || (quantity > 0 ? "active" : "out_of_stock"),
      description: restFields.description || null,
      tax: restFields.tax ? parseFloat(restFields.tax) : null,
      alert_quantity: restFields.alert_quantity
        ? parseInt(restFields.alert_quantity, 10)
        : null,
      categoryId: restFields.categoryId || null,
      brandId: restFields.brandId || null,
      vendorId: restFields.vendorId || null,
      brand_parentcategoriesId: restFields.brand_parentcategoriesId || null,
    };

    let finalProduct;

    // CASE 1: Creating a Master Product
    if (isMaster === "true" || isMaster === true) {
      productData = {
        ...productData,
        isMaster: true,
        masterProductId: null,
        variantOptions: null,
        variantKey: null,
        skuSuffix: null,
      };

      finalProduct = await Product.create(productData, { transaction: t });
    }
    // CASE 2: Creating a Variant (from master)
    else if (masterProductId) {
      const master = await Product.findOne({
        where: { productId: masterProductId, isMaster: true },
        transaction: t,
      });

      if (!master) {
        await t.rollback();
        return res.status(400).json({ message: "Master product not found" });
      }

      let variantOpts = {};
      try {
        variantOpts = variantOptionsInput
          ? JSON.parse(variantOptionsInput)
          : {};
      } catch (e) {
        await t.rollback();
        return res.status(400).json({ message: "Invalid variantOptions JSON" });
      }

      const generatedVariantKey = Object.values(variantOpts)
        .filter(Boolean)
        .join(" ");
      const generatedSkuSuffix = generatedVariantKey
        ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, "-")}`
        : "";

      finalProduct = await Product.create(
        {
          ...productData,
          name: name || `${master.name} - ${generatedVariantKey}`,
          product_code:
            product_code || `${master.product_code}${generatedSkuSuffix}`,
          masterProductId: master.productId,
          isMaster: false,
          variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
          variantKey: generatedVariantKey || variantKey,
          skuSuffix: generatedSkuSuffix || skuSuffix,
          // Inherit from master if not provided
          categoryId: restFields.categoryId || master.categoryId,
          brandId: restFields.brandId || master.brandId,
          vendorId: restFields.vendorId || master.vendorId,
          brand_parentcategoriesId:
            restFields.brand_parentcategoriesId ||
            master.brand_parentcategoriesId,
          images:
            imageUrls.length > 0 ? JSON.stringify(imageUrls) : master.images,
          meta: Object.keys(metaObj).length > 0 ? metaObj : master.meta,
          description: restFields.description || master.description,
        },
        { transaction: t }
      );
    }
    // CASE 3: Standalone product (no master, not master)
    else {
      productData.isMaster = false;
      finalProduct = await Product.create(productData, { transaction: t });
    }

    // Handle keywords (after product exists)
    const keywordIds = req.body.keywordIds || [];
    if (keywordIds.length > 0) {
      await ProductKeyword.destroy({
        where: { productId: finalProduct.productId },
        transaction: t,
      });

      await ProductKeyword.bulkCreate(
        keywordIds.map((id) => ({
          productId: finalProduct.productId,
          keywordId: id,
        })),
        { transaction: t }
      );
    }

    await t.commit();

    // Return full product
    const fullProduct = await Product.findByPk(finalProduct.productId, {
      include: [
        {
          model: ProductKeyword,
          as: "product_keywords",
          include: [{ model: Keyword, as: "keyword", include: ["categories"] }],
        },
      ],
    });

    const keywords = (fullProduct.product_keywords || []).map((pk) => ({
      id: pk.keyword.id,
      keyword: pk.keyword.keyword,
      categories: pk.keyword.categories
        ? {
            categoryId: pk.keyword.categories.categoryId,
            name: pk.keyword.categories.name,
            slug: pk.keyword.categories.slug,
          }
        : null,
    }));

    res.status(201).json({
      message: "Product created successfully",
      product: {
        ...fullProduct.toJSON(),
        images: fullProduct.images ? JSON.parse(fullProduct.images) : [],
        meta: fullProduct.meta || {},
        keywords,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Product Error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to create product" });
  }
};

// ==================== UPDATE PRODUCT ====================
// ==================== UPDATE PRODUCT ====================
// ==================== UPDATE PRODUCT (FULLY FIXED FOR VARIANTS) ====================
exports.updateProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      name,
      product_code,
      quantity,
      isMaster: isMasterInput,
      masterProductId: newMasterId,
      variantOptions: variantOptionsInput,
      variantKey,
      skuSuffix,
      meta: metaInput,
      imagesToDelete: deleteInput,
      isFeatured,
      status,
      ...restFields
    } = req.body;

    // Parse JSON fields safely
    const metaObj = metaInput
      ? typeof metaInput === "string"
        ? JSON.parse(metaInput)
        : metaInput
      : {};

    const imagesToDelete = deleteInput
      ? typeof deleteInput === "string"
        ? JSON.parse(deleteInput)
        : deleteInput
      : [];

    let variantOptions = null;
    if (variantOptionsInput) {
      try {
        variantOptions =
          typeof variantOptionsInput === "string"
            ? JSON.parse(variantOptionsInput)
            : variantOptionsInput;
      } catch (e) {
        await t.rollback();
        return res.status(400).json({ message: "Invalid variantOptions JSON" });
      }
    }

    // Handle images
    let currentImages = product.images ? JSON.parse(product.images) : [];
    currentImages = currentImages.filter(
      (url) => !imagesToDelete.includes(url)
    );

    if (req.files?.length > 0) {
      for (const file of req.files) {
        const url = await uploadToFtp(file.buffer, file.originalname);
        currentImages.push(url);
      }
    }

    const isMaster = isMasterInput === "true" || isMasterInput === true;

    let updateData = {
      name: name?.trim() || product.name,
      product_code: product_code?.trim() || product.product_code,
      quantity:
        quantity !== undefined ? parseInt(quantity, 10) : product.quantity,
      images: JSON.stringify(currentImages),
      meta: Object.keys(metaObj).length > 0 ? metaObj : null,
      isFeatured:
        isFeatured === "true" || isFeatured === true || product.isFeatured,
      status: status || product.status,
      description: restFields.description?.trim() || product.description,
      tax: restFields.tax ? parseFloat(restFields.tax) : product.tax,
      alert_quantity: restFields.alert_quantity
        ? parseInt(restFields.alert_quantity, 10)
        : product.alert_quantity,
      categoryId: restFields.categoryId || product.categoryId,
      brandId: restFields.brandId || product.brandId,
      vendorId: restFields.vendorId || product.vendorId,
      brand_parentcategoriesId:
        restFields.brand_parentcategoriesId || product.brand_parentcategoriesId,
    };

    // ──────────────────────────────────────────────────────────────
    // CASE 1: Converting to Master Product (dangerous — only allow if no variants exist)
    // ──────────────────────────────────────────────────────────────
    if (isMaster && !product.isMaster) {
      const hasVariants = await Product.count({
        where: { masterProductId: product.productId },
        transaction: t,
      });

      if (hasVariants > 0) {
        await t.rollback();
        return res.status(400).json({
          message:
            "Cannot convert to master: this product already has variants attached",
        });
      }

      updateData = {
        ...updateData,
        isMaster: true,
        masterProductId: null,
        variantOptions: null,
        variantKey: null,
        skuSuffix: null,
      };
    }
    // ──────────────────────────────────────────────────────────────
    // CASE 2: This is a Variant → preserve master link + auto-generate fields
    // ──────────────────────────────────────────────────────────────
    else if (
      !isMaster &&
      newMasterId &&
      newMasterId !== product.masterProductId
    ) {
      const master = await Product.findOne({
        where: { productId: newMasterId, isMaster: true },
        transaction: t,
      });

      if (!master) {
        await t.rollback();
        return res.status(400).json({ message: "Master product not found" });
      }

      const variantKeyGen = variantOptions
        ? Object.values(variantOptions).filter(Boolean).join(" ")
        : variantKey || "";

      const skuSuffixGen = variantKeyGen
        ? `-${variantKeyGen.toUpperCase().replace(/\s+/g, "-")}`
        : "";

      updateData = {
        ...updateData,
        masterProductId: master.productId,
        isMaster: false,
        variantOptions: Object.keys(variantOptions || {}).length
          ? variantOptions
          : null,
        variantKey: variantKeyGen || null,
        skuSuffix: skuSuffixGen || null,
        product_code: product_code || `${master.product_code}${skuSuffixGen}`,
        name: name || `${master.name} - ${variantKeyGen}`,
        // Optional: Inherit from master if empty
        categoryId: restFields.categoryId || master.categoryId,
        brandId: restFields.brandId || master.brandId,
        images:
          currentImages.length > 0
            ? JSON.stringify(currentImages)
            : master.images,
        meta: Object.keys(metaObj).length > 0 ? metaObj : master.meta,
      };
    }
    // ──────────────────────────────────────────────────────────────
    // CASE 3: Normal update (standalone or existing variant — just update fields)
    // ──────────────────────────────────────────────────────────────
    else {
      if (!isMaster) {
        // It's a variant — allow variant fields
        const finalVariantKey =
          variantKey ||
          (variantOptions
            ? Object.values(variantOptions).filter(Boolean).join(" ")
            : product.variantKey);
        const finalSkuSuffix =
          skuSuffix ||
          (finalVariantKey
            ? `-${finalVariantKey.toUpperCase().replace(/\s+/g, "-")}`
            : product.skuSuffix);

        updateData.variantKey = finalVariantKey;
        updateData.skuSuffix = finalSkuSuffix;
        updateData.variantOptions = Object.keys(variantOptions || {}).length
          ? variantOptions
          : product.variantOptions;
      } else {
        // It's master → clear variant fields
        updateData.variantOptions = null;
        updateData.variantKey = null;
        updateData.skuSuffix = null;
        updateData.masterProductId = null;
      }

      updateData.isMaster = isMaster;
    }

    // Final update
    await product.update(updateData, { transaction: t });

    // ──────────────────────────────────────────────────────────────
    // Keywords: Use replaceAllKeywordsForProduct mutation or direct DB
    // ──────────────────────────────────────────────────────────────
    const keywordIds = req.body.keywordIds || [];
    if (Array.isArray(keywordIds)) {
      await ProductKeyword.destroy({
        where: { productId: product.productId },
        transaction: t,
      });

      if (keywordIds.length > 0) {
        await ProductKeyword.bulkCreate(
          keywordIds.map((id) => ({
            productId: product.productId,
            keywordId: id,
          })),
          { transaction: t }
        );
      }
    }

    await t.commit();

    // Return fresh data with keywords
    const updatedProduct = await Product.findByPk(product.productId, {
      include: [
        {
          model: ProductKeyword,
          as: "product_keywords",
          include: [
            {
              model: Keyword,
              as: "keyword",
              include: [{ model: Category, as: "categories" }],
            },
          ],
        },
      ],
    });

    const keywords = (updatedProduct.product_keywords || []).map((pk) => ({
      id: pk.keyword.id,
      keyword: pk.keyword.keyword,
      categories: pk.keyword.categories
        ? {
            categoryId: pk.keyword.categories.categoryId,
            name: pk.keyword.categories.name,
            slug: pk.keyword.categories.slug,
          }
        : null,
    }));

    res.json({
      message: "Product updated successfully",
      product: {
        ...updatedProduct.toJSON(),
        images: updatedProduct.images ? JSON.parse(updatedProduct.images) : [],
        meta: updatedProduct.meta || {},
        keywords,
        variantOptions: updatedProduct.variantOptions || {},
        variantKey: updatedProduct.variantKey || null,
        skuSuffix: updatedProduct.skuSuffix || null,
        isMaster: !!updatedProduct.isMaster,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("updateProduct error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update product" });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// Get all products with their meta data
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PRODUCTS (with full variant support + optimized meta lookup)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] }, // optional: reduce payload
      order: [["name", "ASC"]],
      // In getAllProducts → add this include
      include: [
        {
          model: ProductKeyword,
          as: "product_keywords",
          attributes: ["keywordId"],
          include: [
            {
              model: Keyword,
              as: "keyword",
              attributes: ["id", "keyword"],
              include: [
                {
                  model: Category,
                  as: "categories",
                  attributes: ["categoryId", "name", "slug"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (products.length === 0) {
      return res.status(200).json([]);
    }

    // 1. Collect all meta IDs used across all products
    const metaKeySet = new Set();
    products.forEach((p) => {
      if (p.meta) {
        try {
          const meta = typeof p.meta === "string" ? JSON.parse(p.meta) : p.meta;
          Object.keys(meta || {}).forEach((k) => metaKeySet.add(k));
        } catch (_) {}
      }
    });

    // 2. Fetch meta definitions once
    const metaDefinitions = await ProductMeta.findAll({
      where:
        metaKeySet.size > 0
          ? { id: { [Op.in]: [...metaKeySet] } }
          : { id: null },
      attributes: ["id", "title", "slug", "fieldType", "unit"],
    });

    const metaMap = Object.fromEntries(metaDefinitions.map((m) => [m.id, m]));

    // 3. Enrich products
    const enriched = products.map((p) => {
      const raw = p.toJSON();

      // Images
      let images = [];
      if (raw.images) {
        try {
          images =
            typeof raw.images === "string"
              ? JSON.parse(raw.images)
              : raw.images;
        } catch (_) {}
      }

      // Meta object
      let metaObj = {};
      if (raw.meta) {
        try {
          metaObj =
            typeof raw.meta === "string" ? JSON.parse(raw.meta) : raw.meta;
        } catch (_) {}
      }

      // Build metaDetails
      const metaDetails = Object.entries(metaObj).map(([id, value]) => {
        const def = metaMap[id];
        return {
          id,
          title: def?.title ?? "Unknown",
          slug: def?.slug ?? null,
          value: String(value),
          fieldType: def?.fieldType ?? "text",
          unit: def?.unit ?? null,
        };
      });

      return {
        ...raw,
        images,
        meta: metaObj,
        metaDetails,
        variantOptions: raw.variantOptions || {},
        variantKey: raw.variantKey || null,
        skuSuffix: raw.skuSuffix || null,
        isMaster: !!raw.isMaster,
        isVariant: !!raw.masterProductId,
        masterProductId: raw.masterProductId || raw.productId,
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    console.error("getAllProducts error:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE PRODUCT BY ID (with keywords + variants)
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: ProductKeyword,
          as: "product_keywords",
          include: [
            {
              model: Keyword,
              as: "keyword",
              attributes: ["id", "keyword"],
              include: [
                {
                  model: Category,
                  as: "categories",
                  attributes: ["categoryId", "name", "slug"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const raw = product.toJSON();

    // Parse images
    let images = [];
    if (raw.images) {
      try {
        images =
          typeof raw.images === "string" ? JSON.parse(raw.images) : raw.images;
      } catch (_) {}
    }

    // Parse meta
    let metaObj = {};
    if (raw.meta) {
      try {
        metaObj =
          typeof raw.meta === "string" ? JSON.parse(raw.meta) : raw.meta;
      } catch (_) {}
    }

    // Fetch meta definitions
    const metaIds = Object.keys(metaObj);
    const metaDefinitions = metaIds.length
      ? await ProductMeta.findAll({
          where: { id: { [Op.in]: metaIds } },
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        })
      : [];

    const metaMap = Object.fromEntries(metaDefinitions.map((m) => [m.id, m]));

    const metaDetails = metaIds.map((id) => ({
      id,
      title: metaMap[id]?.title ?? "Unknown",
      slug: metaMap[id]?.slug ?? null,
      value: String(metaObj[id] ?? ""),
      fieldType: metaMap[id]?.fieldType ?? "text",
      unit: metaMap[id]?.unit ?? null,
    }));

    // Keywords from association
    const keywords = (raw.product_keywords || []).map((pk) => ({
      id: pk.keyword.id,
      keyword: pk.keyword.keyword,
      // Change from "category" to "categories"
      categories: pk.keyword.categories
        ? {
            categoryId: pk.keyword.categories.categoryId,
            name: pk.keyword.categories.name,
            slug: pk.keyword.categories.slug,
          }
        : null,
    }));

    delete raw.product_keywords;

    res.status(200).json({
      ...raw,
      images,
      meta: metaObj,
      metaDetails,
      keywords,
      variantOptions: raw.variantOptions || {},
      variantKey: raw.variantKey || null,
      skuSuffix: raw.skuSuffix || null,
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
      masterProductId: raw.masterProductId || raw.productId,
    });
  } catch (error) {
    console.error("getProductById error:", error);
    res
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
// GET /api/products/:productId/with-variants
exports.getProductWithVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const master = await Product.findByPk(productId);
    if (!master) return res.status(404).json({ message: "Not found" });

    let variants = [];
    let mainProduct = master.toJSON();

    if (mainProduct.isMaster || !mainProduct.masterProductId) {
      // This is master → fetch all variants
      variants = await Product.findAll({
        where: { masterProductId: productId },
        order: [["variantKey", "ASC"]],
      });
    } else {
      // This is a variant → fetch master + siblings
      mainProduct = await Product.findByPk(mainProduct.masterProductId);
      variants = await Product.findAll({
        where: { masterProductId: mainProduct.masterProductId },
      });
    }

    const enrichedVariants = variants.map((v) => enrichProduct(v)); // reuse your enrich logic

    res.json({
      master: enrichProduct(mainProduct),
      variants: enrichedVariants,
      totalVariants: enrichedVariants.length,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
// POST /api/products/:masterId/variants
exports.createVariant = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { masterId } = req.params;
    const { name, variantOptions, meta, quantity = 0 } = req.body;

    const master = await Product.findByPk(masterId, { transaction: t });
    if (!master || !master.isMaster) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid master product" });
    }

    const variantKey = Object.values(variantOptions || {}).join(" ");
    const suffix = `-${variantKey.toUpperCase().replace(/\s+/g, "-")}`;

    const variant = await Product.create(
      {
        name: name || `${master.name} - ${variantKey}`,
        product_code: `${master.product_code}${suffix}`,
        quantity,
        masterProductId: masterId,
        isMaster: false,
        variantOptions,
        variantKey,
        skuSuffix: suffix,
        categoryId: master.categoryId,
        brandId: master.brandId,
        images: master.images,
        description: master.description,
        meta: meta ? JSON.stringify(meta) : master.meta,
        status: "active",
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({ message: "Variant created", variant });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ message: e.message });
  }
};
// controllers/product.controller.js (add this function)

exports.addKeywordsToProduct = async (req, res) => {
  const { productId } = req.params;
  const { keywordIds } = req.body; // array of keyword UUIDs

  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    return res.status(400).json({ message: "keywordIds array is required" });
  }

  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate all keywordIds exist
    const keywords = await Keyword.findAll({
      where: { id: keywordIds },
    });

    if (keywords.length !== keywordIds.length) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "One or more keyword IDs are invalid" });
    }

    // Bulk create associations (ignore duplicates)
    const associations = keywordIds.map((kid) => ({
      productId,
      keywordId: kid,
    }));

    await ProductKeyword.bulkCreate(associations, {
      ignoreDuplicates: true, // prevents duplicate entry error
      transaction: t,
    });

    await t.commit();

    // Return updated list of keywords for this product
    const updatedKeywords = await ProductKeyword.findAll({
      where: { productId },
      include: [
        {
          model: Keyword,
          as: "keyword",
          attributes: ["id", "keyword", "categoryId"],
          include: [
            { model: Category, as: "categories", attributes: ["name", "slug"] },
          ],
        },
      ],
    });

    res.status(200).json({
      message: "Keywords added successfully",
      keywords: updatedKeywords.map((pk) => ({
        id: pk.Keyword.id,
        keyword: pk.Keyword.keyword,
        category: pk.Keyword.categories,
      })),
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};
exports.removeKeywordFromProduct = async (req, res) => {
  const { productId, keywordId } = req.params;

  try {
    const deleted = await ProductKeyword.destroy({
      where: { productId, keywordId },
    });

    if (deleted === 0) {
      return res
        .status(404)
        .json({ message: "Keyword not associated with this product" });
    }

    res.status(200).json({ message: "Keyword removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.removeAllKeywordsFromProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    await ProductKeyword.destroy({ where: { productId } });
    res.status(200).json({ message: "All keywords removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// controllers/product.controller.js

// Replace ALL keywords for a product (used in edit mode)
exports.replaceAllKeywordsForProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { productId } = req.params;
    let { keywordIds } = req.body;

    // ────── DEFENSIVE PROGRAMMING (Handles ALL edge cases) ──────
    if (!keywordIds) {
      keywordIds = [];
    }

    // If frontend accidentally sends stringified JSON
    if (typeof keywordIds === "string") {
      try {
        keywordIds = JSON.parse(keywordIds);
      } catch (e) {
        keywordIds = [];
      }
    }

    // Final safety check
    if (!Array.isArray(keywordIds)) {
      return res.status(400).json({
        message: "keywordIds must be an array",
        received: keywordIds,
      });
    }

    // Remove duplicates and invalid values
    const cleanKeywordIds = [
      ...new Set(keywordIds.filter((id) => id && typeof id === "string")),
    ];

    // ────── Validate product exists ──────
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    // ────── Replace keywords in one transaction ──────
    await ProductKeyword.destroy({
      where: { productId },
      transaction: t,
    });

    if (cleanKeywordIds.length > 0) {
      // Validate all keyword IDs exist
      const validKeywords = await Keyword.findAll({
        where: { id: cleanKeywordIds },
        attributes: ["id"],
        transaction: t,
      });

      const validIds = validKeywords.map((k) => k.id);
      const invalidIds = cleanKeywordIds.filter((id) => !validIds.includes(id));

      if (invalidIds.length > 0) {
        await t.rollback();
        return res.status(400).json({
          message: "Invalid keyword IDs",
          invalidIds,
        });
      }

      // Bulk insert
      await ProductKeyword.bulkCreate(
        cleanKeywordIds.map((id) => ({
          productId,
          keywordId: id,
        })),
        { transaction: t }
      );
    }

    await t.commit();

    return res.json({
      message: "Keywords replaced successfully",
      message: "Keywords replaced successfully",
      count: cleanKeywordIds.length,
    });
  } catch (error) {
    await t.rollback();
    console.error("replaceAllKeywordsForProduct error:", error);
    return res.status(500).json({
      message: "Failed to update keywords",
      error: error.message,
    });
  }
};
