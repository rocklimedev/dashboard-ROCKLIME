const { Op } = require("sequelize");
const sequelize = require("../config/database");

const {
  Product,
  ProductMeta,
  InventoryHistory,
  Brand,
  User,
  ProductKeyword,
  Keyword,
  Category,
  Quotation,
  Order,
} = require("../models");
// ─────────────────────────────────────────────────────────────────────────────
// Create a product with meta data
// ─────────────────────────────────────────────────────────────────────────────
// controllers/productController.js
// controllers/productController.js

// Correct import
const { uploadToFtp } = require("../middleware/upload"); // ← this is where it really is
// controllers/productController.js

// THIS IS THE MAGIC FIX — RUN IT ON EVERY REQUEST
const ensureAssociations = () => {
  // Force Product ↔ Keyword (M:N)
  if (!Product.associations.keywords) {
    Product.belongsToMany(Keyword, {
      through: "products_keywords",
      foreignKey: "productId",
      otherKey: "keywordId",
      as: "keywords",
    });
  }

  if (!Keyword.associations.products) {
    Keyword.belongsToMany(Product, {
      through: "products_keywords",
      foreignKey: "keywordId",
      otherKey: "productId",
      as: "products",
    });
  }

  // Force Keyword → Category
  if (!Keyword.associations.categories) {
    Keyword.belongsTo(Category, {
      foreignKey: "categoryId",
      as: "categories",
    });
  }
};
// Helper: safely parse JSON with fallback and logging
const parseJsonSafely = (input, fallback = {}, context = "") => {
  if (input == null) return fallback;
  if (typeof input !== "string") return input; // already object/array

  const trimmed = input.trim();
  if (trimmed === "" || trimmed === "null") return fallback;

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    console.warn(
      `Invalid JSON detected in ${context}:`,
      trimmed.substring(0, 200)
    );
    return fallback;
  }
};

// ==================== CREATE PRODUCT ====================
exports.createProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // THIS LINE FIXES EVERYTHING ON RENDER
    ensureAssociations();
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
      keywordIds = [], // ← can be string or array
      ...restFields
    } = req.body;

    // Parse meta safely
    let metaObj = {};
    if (metaInput) {
      try {
        metaObj =
          typeof metaInput === "string" ? JSON.parse(metaInput) : metaInput;
      } catch (e) {
        return res.status(400).json({ message: "Invalid meta JSON" });
      }
    }

    // Upload images
    let imageUrls = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const url = await uploadToFtp(file.buffer, file.originalname);
        imageUrls.push(url);
      }
    }

    const productData = {
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

    // CASE 1: Master Product
    if (isMaster === "true" || isMaster === true) {
      finalProduct = await Product.create(
        {
          ...productData,
          isMaster: true,
          masterProductId: null,
          variantOptions: null,
          variantKey: null,
          skuSuffix: null,
        },
        { transaction: t }
      );
    }
    // CASE 2: Variant of a Master
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
    // CASE 3: Standalone Product
    else {
      finalProduct = await Product.create(
        { ...productData, isMaster: false },
        { transaction: t }
      );
    }

    // Set keywords using belongsToMany magic method
    const cleanKeywordIds = Array.isArray(keywordIds)
      ? keywordIds.filter((id) => id)
      : typeof keywordIds === "string"
      ? keywordIds
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id)
      : [];

    await finalProduct.setKeywords(cleanKeywordIds, { transaction: t });

    await t.commit();

    // Return fresh product with keywords
    const product = await Product.findByPk(finalProduct.productId, {
      include: [
        {
          model: Keyword,
          as: "keywords",
          attributes: ["id", "keyword"],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: "categories",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
    });

    const keywords = (product.keywords || []).map((k) => ({
      id: k.id,
      keyword: k.keyword,
      categories: k.categories
        ? {
            categoryId: k.categories.categoryId,
            name: k.categories.name,
            slug: k.categories.slug,
          }
        : null,
    }));

    res.status(201).json({
      message: "Product created successfully",
      product: {
        ...product.toJSON(),
        images: product.images ? JSON.parse(product.images) : [],
        meta: product.meta || {},
        keywords,
        variantOptions: product.variantOptions || {},
        variantKey: product.variantKey || null,
        skuSuffix: product.skuSuffix || null,
        isMaster: !!product.isMaster,
        isVariant: !!product.masterProductId,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("createProduct error:", error);
    res
      .status(500)
      .json({ message: "Failed to create product", error: error.message });
  }
};

// ==================== UPDATE PRODUCT ====================
exports.updateProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // THIS LINE FIXES EVERYTHING ON RENDER
    ensureAssociations();
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
      keywordIds = [],
      ...restFields
    } = req.body;

    // Parse meta
    let metaObj = {};
    if (metaInput) {
      try {
        metaObj =
          typeof metaInput === "string" ? JSON.parse(metaInput) : metaInput;
      } catch (e) {
        await t.rollback();
        return res.status(400).json({ message: "Invalid meta JSON" });
      }
    }

    // Handle image deletion + upload
    let currentImages = product.images ? JSON.parse(product.images) : [];
    const imagesToDelete = deleteInput
      ? typeof deleteInput === "string"
        ? JSON.parse(deleteInput)
        : deleteInput
      : [];
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

    // Variant/Master logic (unchanged — your logic is perfect)
    if (isMaster && !product.isMaster) {
      const hasVariants = await Product.count({
        where: { masterProductId: product.productId },
        transaction: t,
      });
      if (hasVariants > 0) {
        await t.rollback();
        return res
          .status(400)
          .json({ message: "Cannot convert to master: has variants" });
      }
      Object.assign(updateData, {
        isMaster: true,
        masterProductId: null,
        variantOptions: null,
        variantKey: null,
        skuSuffix: null,
      });
    } else if (
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
      const variantOpts = variantOptionsInput
        ? JSON.parse(variantOptionsInput)
        : {};
      const key = Object.values(variantOpts).filter(Boolean).join(" ");
      const suffix = key ? `-${key.toUpperCase().replace(/\s+/g, "-")}` : "";
      Object.assign(updateData, {
        masterProductId: master.productId,
        isMaster: false,
        variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
        variantKey: key || null,
        skuSuffix: suffix || null,
        product_code: product_code || `${master.product_code}${suffix}`,
        name: name || `${master.name} - ${key}`,
        categoryId: restFields.categoryId || master.categoryId,
        brandId: restFields.brandId || master.brandId,
        images:
          currentImages.length > 0
            ? JSON.stringify(currentImages)
            : master.images,
        meta: Object.keys(metaObj).length > 0 ? metaObj : master.meta,
      });
    } else {
      if (!isMaster) {
        const finalKey =
          variantKey ||
          (variantOptionsInput
            ? Object.values(JSON.parse(variantOptionsInput))
                .filter(Boolean)
                .join(" ")
            : product.variantKey);
        const finalSuffix = finalKey
          ? `-${finalKey.toUpperCase().replace(/\s+/g, "-")}`
          : product.skuSuffix;
        updateData.variantKey = finalKey;
        updateData.skuSuffix = finalSuffix;
        updateData.variantOptions = variantOptionsInput
          ? JSON.parse(variantOptionsInput)
          : product.variantOptions;
      } else {
        updateData.variantOptions = null;
        updateData.variantKey = null;
        updateData.skuSuffix = null;
        updateData.masterProductId = null;
      }
      updateData.isMaster = isMaster;
    }

    await product.update(updateData, { transaction: t });

    // Replace all keywords — ONE LINE
    const cleanKeywordIds = Array.isArray(keywordIds)
      ? keywordIds.filter(Boolean)
      : typeof keywordIds === "string"
      ? keywordIds
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id)
      : [];
    await product.setKeywords(cleanKeywordIds, { transaction: t });

    await t.commit();

    // Return fresh data
    const updated = await Product.findByPk(productId, {
      include: [
        {
          model: Keyword,
          as: "keywords",
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: "categories",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
    });

    const keywords = (updated.keywords || []).map((k) => ({
      id: k.id,
      keyword: k.keyword,
      categories: k.categories
        ? {
            categoryId: k.categories.categoryId,
            name: k.categories.name,
            slug: k.categories.slug,
          }
        : null,
    }));

    res.json({
      message: "Product updated successfully",
      product: {
        ...updated.toJSON(),
        images: updated.images ? JSON.parse(updated.images) : [],
        meta: updated.meta || {},
        keywords,
        variantOptions: updated.variantOptions || {},
        variantKey: updated.variantKey || null,
        skuSuffix: updated.skuSuffix || null,
        isMaster: !!updated.isMaster,
        isVariant: !!updated.masterProductId,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("updateProduct error:", error);
    res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all products (paginated, searchable, enriched meta & keywords)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    ensureAssociations();

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // ── Search support (MySQL compatible – case-insensitive) ────────────
    const searchTerm = req.query.search?.trim();
    let whereClause = {};

    if (searchTerm) {
      const pattern = `%${searchTerm.toLowerCase()}%`;

      whereClause = {
        [Op.or]: [
          // Product name
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("Product.name")),
            Op.like,
            pattern
          ),

          // Company code in JSON meta (using the UUID from your frontend logic)
          // Inside the Op.or array, replace the company code line with:

          sequelize.where(
            sequelize.fn(
              "LOWER",
              sequelize.fn(
                "JSON_EXTRACT",
                sequelize.col("Product.meta"),
                sequelize.literal("'$.d11da9f9-3f2e-4536-8236-9671200cca4a'") // ← literal string + single quotes
              )
            ),
            Op.like,
            pattern
          ),

          // Keywords
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("keywords.keyword")),
            Op.like,
            pattern
          ),

          // Category names (via keyword → category)
          sequelize.where(
            sequelize.fn("LOWER", sequelize.col("keywords.categories.name")),
            Op.like,
            pattern
          ),

          // Optional: if you have product_code / sku as real columns
          // sequelize.where(sequelize.fn('LOWER', sequelize.col('Product.product_code')), Op.like, pattern),
        ],
      };
    }
    // ────────────────────────────────────────────────────────────────────

    // Use findAndCountAll for efficient pagination + total count
    const { count: totalProducts, rows: products } =
      await Product.findAndCountAll({
        where: whereClause,
        order: [["name", "ASC"]],
        offset,
        limit,
        include: [
          {
            model: Keyword,
            as: "keywords",
            attributes: ["id", "keyword"],
            through: { attributes: [] },
            include: [
              {
                model: Category,
                as: "categories",
                attributes: ["categoryId", "name", "slug"],
              },
            ],
          },
        ],
        subQuery: false,
      });

    if (totalProducts === 0) {
      return res.json({
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    // Collect all meta IDs used across products (your original efficient approach)
    const metaIds = new Set();
    products.forEach((product) => {
      const meta = parseJsonSafely(
        product.meta,
        null,
        `product ID ${product.id} meta`
      );
      if (meta && typeof meta === "object") {
        Object.keys(meta).forEach((id) => metaIds.add(id));
      }
    });

    // Fetch meta definitions once
    const metaDefs =
      metaIds.size > 0
        ? await ProductMeta.findAll({
            where: { id: { [Op.in]: Array.from(metaIds) } },
            attributes: ["id", "title", "slug", "fieldType", "unit"],
          })
        : [];

    const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));

    // Transform and enrich products
    const enrichedProducts = products.map((product) => {
      const raw = product.toJSON();

      // Safely parse meta and images
      const metaObj = parseJsonSafely(
        raw.meta,
        {},
        `product ID ${raw.id} meta`
      );
      const images = parseJsonSafely(
        raw.images,
        [],
        `product ID ${raw.id} images`
      );

      // Build detailed meta with titles, units, etc.
      const metaDetails = Object.entries(metaObj).map(([idStr, value]) => {
        const id = parseInt(idStr, 10);
        const def = metaMap[id] || {};
        return {
          id,
          title: def.title || "Unknown Field",
          slug: def.slug || null,
          value: value != null ? String(value) : "",
          fieldType: def.fieldType || "text",
          unit: def.unit || null,
        };
      });

      // Clean keyword structure
      const keywords = (raw.keywords || []).map((k) => ({
        id: k.id,
        keyword: k.keyword,
        categories: k.categories
          ? {
              categoryId: k.categories.categoryId,
              name: k.categories.name,
              slug: k.categories.slug,
            }
          : null,
      }));

      return {
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
        masterProductId: raw.masterProductId || raw.id,
      };
    });

    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      data: enrichedProducts,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("getAllProducts error:", error);
    res.status(500).json({
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// ==================== GET SINGLE PRODUCT ====================
exports.getProductById = async (req, res) => {
  try {
    // THIS LINE FIXES EVERYTHING ON RENDER
    ensureAssociations();
    const { productId } = req.params;

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Keyword,
          as: "keywords",
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: "categories",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const raw = product.toJSON();
    const metaObj = raw.meta
      ? typeof raw.meta === "string"
        ? JSON.parse(raw.meta)
        : raw.meta
      : {};
    const metaIds = Object.keys(metaObj);

    const metaDefs = metaIds.length
      ? await ProductMeta.findAll({
          where: { id: { [Op.in]: metaIds } },
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        })
      : [];
    const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m]));

    const metaDetails = metaIds.map((id) => ({
      id,
      title: metaMap[id]?.title ?? "Unknown",
      slug: metaMap[id]?.slug ?? null,
      value: String(metaObj[id] ?? ""),
      fieldType: metaMap[id]?.fieldType ?? "text",
      unit: metaMap[id]?.unit ?? null,
    }));

    const keywords = (raw.keywords || []).map((k) => ({
      id: k.id,
      keyword: k.keyword,
      categories: k.categories
        ? {
            categoryId: k.categories.categoryId,
            name: k.categories.name,
            slug: k.categories.slug,
          }
        : null,
    }));

    res.json({
      ...raw,
      images: raw.images ? JSON.parse(raw.images) : [],
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
    res.status(500).json({ message: "Error fetching product" });
  }
};

// ==================== DELETE PRODUCT ====================
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.destroy();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product" });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// Get products by category
// ─────────────────────────────────────────────────────────────────────────────

exports.getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { page = 1, limit = 50, search } = req.query;

  if (!categoryId) {
    return res.status(400).json({ message: "Category ID is required." });
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    return res.status(400).json({ message: "Invalid pagination parameters." });
  }

  try {
    ensureAssociations();

    // ── Base where clause ───────────────────────────────────────────────
    const where = { categoryId };

    // ── Search support (MySQL compatible – case-insensitive) ────────────
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const pattern = `%${searchTerm}%`;

      where[Op.or] = [
        // Product name
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("Product.name")),
          Op.like,
          pattern
        ),

        // Company code in JSON meta
        // Inside the Op.or array, replace the company code line with:

        sequelize.where(
          sequelize.fn(
            "LOWER",
            sequelize.fn(
              "JSON_EXTRACT",
              sequelize.col("Product.meta"),
              sequelize.literal("'$.d11da9f9-3f2e-4536-8236-9671200cca4a'") // ← literal string + single quotes
            )
          ),
          Op.like,
          pattern
        ),

        // Keywords
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("keywords.keyword")),
          Op.like,
          pattern
        ),

        // Category names (via keyword → category)
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("keywords.categories.name")),
          Op.like,
          pattern
        ),

        // Optional: if you have product_code / sku as real column
        // sequelize.where(sequelize.fn('LOWER', sequelize.col('Product.product_code')), Op.like, pattern),
      ];
    }
    // ────────────────────────────────────────────────────────────────────

    const { count: total, rows: products } = await Product.findAndCountAll({
      where,
      offset,
      limit: limitNum,
      order: [["name", "ASC"]],
      include: [
        {
          model: Keyword,
          as: "keywords",
          attributes: ["id", "keyword"],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: "categories",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
      subQuery: false, // Important for correct count with nested includes
    });

    if (total === 0) {
      return res.json({
        data: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      });
    }

    // ── Fetch all meta definitions once ─────────────────────────────────
    const allMetaDefs = await ProductMeta.findAll({
      attributes: ["id", "title", "slug", "fieldType", "unit"],
    });

    const metaMap = {};
    allMetaDefs.forEach((m) => {
      const def = m.toJSON();
      metaMap[def.id] = def;
    });

    // ── Enrich products ─────────────────────────────────────────────────
    const enriched = products.map((p) => {
      const raw = p.toJSON();

      // Safely parse meta & images
      const metaObj = parseJsonSafely(raw.meta, {}, `product ${raw.id}`);
      const images = parseJsonSafely(
        raw.images,
        [],
        `product ${raw.id} images`
      );

      // Build metaDetails
      const metaDetails = Object.entries(metaObj)
        .map(([idStr, value]) => {
          const id = parseInt(idStr, 10);
          if (isNaN(id)) return null;
          const def = metaMap[id];
          if (!def) return null;
          return {
            id,
            title: def.title || "Unknown",
            slug: def.slug || null,
            value: value != null ? String(value) : "",
            fieldType: def.fieldType || "text",
            unit: def.unit || null,
          };
        })
        .filter(Boolean);

      // Clean keywords
      const keywords = (raw.keywords || []).map((k) => ({
        id: k.id,
        keyword: k.keyword,
        categories: k.categories
          ? {
              categoryId: k.categories.categoryId,
              name: k.categories.name,
              slug: k.categories.slug,
            }
          : null,
      }));

      return {
        ...raw,
        images,
        meta: metaObj,
        metaDetails,
        keywords,
        // Add other fields you need (variantOptions, skuSuffix, isMaster, etc.)
        variantOptions: raw.variantOptions || {},
        variantKey: raw.variantKey || null,
        skuSuffix: raw.skuSuffix || null,
        isMaster: !!raw.isMaster,
        isVariant: !!raw.masterProductId,
        masterProductId: raw.masterProductId || raw.id,
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("getProductsByCategory error:", error);
    res.status(500).json({
      message: "Failed to fetch products by category",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// Get products by brandId (with pagination, search, and metaDetails)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Get products by brandId (paginated, searchable, enriched meta & keywords)
// ─────────────────────────────────────────────────────────────────────────────
exports.getProductsByBrand = async (req, res) => {
  const { brandId } = req.params;
  const { page = 1, limit = 50, search } = req.query;

  if (!brandId) {
    return res.status(400).json({ message: "Brand ID is required." });
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    return res.status(400).json({ message: "Invalid pagination parameters." });
  }

  try {
    ensureAssociations();

    // ── Base where clause ───────────────────────────────────────────────
    const where = { brandId };

    // ── Search support (MySQL compatible – case-insensitive) ────────────
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const pattern = `%${searchTerm}%`;

      where[Op.or] = [
        // Product name
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("Product.name")),
          Op.like,
          pattern
        ),

        // Company code / Model code in JSON meta – FIXED with quoted key
        sequelize.where(
          sequelize.fn(
            "LOWER",
            sequelize.fn(
              "JSON_EXTRACT",
              sequelize.col("Product.meta"),
              sequelize.literal(`'$."d11da9f9-3f2e-4536-8236-9671200cca4a"'`)
            )
          ),
          Op.like,
          pattern
        ),

        // Keywords
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("keywords.keyword")),
          Op.like,
          pattern
        ),

        // Category names (via keyword → category relation)
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("keywords.categories.name")),
          Op.like,
          pattern
        ),

        // Optional: uncomment if you have a real product_code / sku column
        // sequelize.where(
        //   sequelize.fn("LOWER", sequelize.col("Product.product_code")),
        //   Op.like,
        //   pattern
        // ),
      ];
    }
    // ────────────────────────────────────────────────────────────────────

    const { count: totalProducts, rows: products } =
      await Product.findAndCountAll({
        where,
        offset,
        limit: limitNum,
        order: [["name", "ASC"]],
        include: [
          {
            model: Keyword,
            as: "keywords",
            attributes: ["id", "keyword"],
            through: { attributes: [] },
            include: [
              {
                model: Category,
                as: "categories",
                attributes: ["categoryId", "name", "slug"],
              },
            ],
          },
        ],
        subQuery: false, // Important for correct count with nested includes
      });

    if (totalProducts === 0) {
      return res.json({
        data: [],
        pagination: {
          total: 0,
          page: pageNum,
          limit: limitNum,
          totalPages: 0,
        },
      });
    }

    // ── Fetch all meta definitions once (small table) ───────────────────
    const metaDefs = await ProductMeta.findAll({
      attributes: ["id", "title", "slug", "fieldType", "unit"],
    });

    const metaMap = Object.fromEntries(
      metaDefs.map((m) => {
        const def = m.toJSON();
        return [def.id, def];
      })
    );

    // ── Enrich products ─────────────────────────────────────────────────
    const enrichedProducts = products.map((product) => {
      const raw = product.toJSON();

      // Safely parse JSON fields
      const metaObj = parseJsonSafely(
        raw.meta,
        {},
        `product ${raw.id || raw.productId} meta`
      );
      const images = parseJsonSafely(
        raw.images,
        [],
        `product ${raw.id || raw.productId} images`
      );

      // Build metaDetails from meta object + definitions
      const metaDetails = Object.entries(metaObj)
        .map(([idStr, value]) => {
          const id = parseInt(idStr, 10);
          if (isNaN(id)) return null;
          const def = metaMap[id];
          if (!def) return null;

          return {
            id,
            title: def.title || "Unknown Field",
            slug: def.slug || null,
            value: value != null ? String(value) : "",
            fieldType: def.fieldType || "text",
            unit: def.unit || null,
          };
        })
        .filter(Boolean);

      // Clean keywords structure
      const keywords = (raw.keywords || []).map((k) => ({
        id: k.id,
        keyword: k.keyword,
        categories: k.categories
          ? {
              categoryId: k.categories.categoryId,
              name: k.categories.name,
              slug: k.categories.slug,
            }
          : null,
      }));

      return {
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
        masterProductId: raw.masterProductId || raw.id || raw.productId,
      };
    });

    const totalPages = Math.ceil(totalProducts / limitNum);

    res.json({
      data: enrichedProducts,
      pagination: {
        total: totalProducts,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("getProductsByBrand error:", error);
    res.status(500).json({
      message: "Failed to fetch products by brand",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
      q, // ← rename 'query' to 'q' to match frontend usage (useSearchProductsQuery sends ?q=...)
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

    // Support both ?q=... (from frontend search) and ?query=... (backward compat)
    const searchTerm = (q || req.query.query || "").trim();

    const filters = {};

    // ── Build search filters ────────────────────────────────────────────────
    if (searchTerm) {
      const pattern = `%${searchTerm.toLowerCase()}%`;

      filters[Op.or] = [
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("Product.name")),
          Op.like,
          pattern
        ),
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("Product.product_code")),
          Op.like,
          pattern
        ),
        // Search inside meta → model code / company code (UUID key)
        sequelize.where(
          sequelize.fn(
            "LOWER",
            sequelize.fn(
              "JSON_EXTRACT",
              sequelize.col("Product.meta"),
              sequelize.literal("'$.\"d11da9f9-3f2e-4536-8236-9671200cca4a\"'")
            )
          ),
          Op.like,
          pattern
        ),
        // Brand / Category UUID match
        { brandId: { [Op.eq]: searchTerm } },
        { categoryId: { [Op.eq]: searchTerm } },
      ];
    }

    // Additional exact filters (same as before)
    if (name) filters.name = { [Op.iLike]: `%${name}%` };
    if (sellingPrice) filters["meta->sellingPrice"] = Number(sellingPrice);
    if (minSellingPrice)
      filters["meta->sellingPrice"] = { [Op.gte]: Number(minSellingPrice) };
    if (maxSellingPrice)
      filters["meta->sellingPrice"] = { [Op.lte]: Number(maxSellingPrice) };
    // ... same for purchasingPrice ...

    if (companyCode) filters.companyCode = companyCode;
    if (productCode) filters.product_code = productCode;
    if (brandId) filters.brandId = brandId;
    if (categoryId) filters.categoryId = categoryId;

    // ── Fetch products + metas ──────────────────────────────────────────────
    const products = await Product.findAll({
      where: filters,
      include: [
        {
          model: ProductMeta,
          as: "product_metas",
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        },
        // Optional: add keywords if you want to search them too (like getAllProducts)
        // {
        //   model: Keyword,
        //   as: "keywords",
        //   through: { attributes: [] },
        //   include: [{ model: Category, as: "categories", attributes: ["name"] }],
        // },
      ],
      order: [["name", "ASC"]],
      limit: 100, // ← reasonable default for search – adjust as needed
    });

    if (products.length === 0) {
      return res.status(200).json([]);
    }

    // Collect all used meta IDs once
    const metaIds = new Set();
    products.forEach((p) => {
      const meta = parseJsonSafely(p.meta, {});
      Object.keys(meta).forEach((id) => metaIds.add(id));
    });

    // Fetch definitions only for used IDs
    const metaDefs =
      metaIds.size > 0
        ? await ProductMeta.findAll({
            where: { id: { [Op.in]: Array.from(metaIds) } },
            attributes: ["id", "title", "slug", "fieldType", "unit"],
          })
        : [];

    const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));

    // ── Enrich products (same structure as getAllProducts / getProductById) ──
    const enrichedProducts = products.map((product) => {
      const raw = product.toJSON();

      const metaObj = parseJsonSafely(raw.meta, {}, `product ${raw.productId}`);
      const images = parseJsonSafely(
        raw.images,
        [],
        `product ${raw.productId} images`
      );

      // Build metaDetails safely
      const metaDetails = Object.entries(metaObj)
        .map(([idStr, value]) => {
          const id = parseInt(idStr, 10);
          if (isNaN(id)) return null;
          const def = metaMap[id];
          return {
            id,
            title: def?.title ?? "Unknown Field",
            slug: def?.slug ?? null,
            value: value != null ? String(value) : "",
            fieldType: def?.fieldType ?? "text",
            unit: def?.unit ?? null,
          };
        })
        .filter(Boolean);

      return {
        ...raw,
        images,
        meta: metaObj,
        metaDetails,
        // If you later add keywords include, clean it here too
        // keywords: ...,
        variantOptions: raw.variantOptions || {},
        variantKey: raw.variantKey || null,
        skuSuffix: raw.skuSuffix || null,
        isMaster: !!raw.isMaster,
        isVariant: !!raw.masterProductId,
        masterProductId: raw.masterProductId || raw.productId,
      };
    });

    return res.status(200).json(enrichedProducts);
  } catch (error) {
    console.error("searchProducts error:", error);
    return res.status(500).json({
      message: "Error searching products",
      error: error.message,
    });
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

    // Ensure associations are loaded (same as getAllProducts)
    ensureAssociations();

    // Fetch products with same includes as getAllProducts
    const products = await Product.findAll({
      where: {
        productId: { [Op.in]: productIds },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"], // optional: match getAllProducts behavior
      },
      order: [["name", "ASC"]],
      include: [
        {
          model: Keyword,
          as: "keywords",
          attributes: ["id", "keyword"],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: "categories",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
    });

    // Check for missing products
    const foundProductIds = products.map((p) => p.productId);
    const missingIds = productIds.filter((id) => !foundProductIds.includes(id));

    if (missingIds.length > 0) {
      return res.status(404).json({
        message: `Products not found for IDs: ${missingIds.join(", ")}`,
      });
    }

    // ──────── ENRICHMENT (same logic as getAllProducts) ────────

    // Collect all meta IDs
    const metaIds = new Set();
    products.forEach((product) => {
      const meta = parseJsonSafely(
        product.meta,
        null,
        `product ID ${product.id} meta`
      );
      if (meta && typeof meta === "object") {
        Object.keys(meta).forEach((id) => metaIds.add(id));
      }
    });

    // Fetch meta definitions in bulk
    const metaDefs =
      metaIds.size > 0
        ? await ProductMeta.findAll({
            where: { id: { [Op.in]: Array.from(metaIds) } },
            attributes: ["id", "title", "slug", "fieldType", "unit"],
          })
        : [];

    const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));

    // Enrich each product
    const enrichedProducts = products.map((product) => {
      const raw = product.toJSON();

      // Parse meta and images safely
      const metaObj = parseJsonSafely(
        raw.meta,
        {},
        `product ID ${raw.id} meta`
      );
      const images = parseJsonSafely(
        raw.images,
        [],
        `product ID ${raw.id} images`
      );

      // Build enriched metaDetails
      const metaDetails = Object.entries(metaObj).map(([id, value]) => {
        const def = metaMap[id] || {};
        return {
          id,
          title: def.title || "Unknown Field",
          slug: def.slug || null,
          value: value != null ? String(value) : "",
          fieldType: def.fieldType || "text",
          unit: def.unit || null,
        };
      });

      // Clean keywords structure
      const keywords = (raw.keywords || []).map((k) => ({
        id: k.id,
        keyword: k.keyword,
        categories: k.categories
          ? {
              categoryId: k.categories.categoryId,
              name: k.categories.name,
              slug: k.categories.slug,
            }
          : null,
      }));

      return {
        ...raw,
        images, // always array
        meta: metaObj, // parsed object
        metaDetails, // enriched
        keywords,
        variantOptions: raw.variantOptions || {},
        variantKey: raw.variantKey || null,
        skuSuffix: raw.skuSuffix || null,
        isMaster: !!raw.isMaster,
        isVariant: !!raw.masterProductId,
        masterProductId: raw.masterProductId || raw.id,
      };
    });

    // ──────── RESPONSE (consistent with getAllProducts style) ────────
    return res.status(200).json({
      data: enrichedProducts,
      pagination: {
        total: enrichedProducts.length,
        page: 1,
        limit: enrichedProducts.length,
        totalPages: 1,
      },
    });
  } catch (err) {
    console.error("getProductsByIds error:", err);
    return res.status(500).json({
      message: "Failed to fetch products by IDs",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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
// ───────────────────────────────
// Replace ALL keywords for a product (clean version)
// ───────────────────────────────
exports.replaceAllKeywordsForProduct = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId } = req.params;
    let { keywordIds = [] } = req.body;

    // Normalize input
    if (typeof keywordIds === "string") {
      try {
        keywordIds = JSON.parse(keywordIds);
      } catch {
        keywordIds = [];
      }
    }
    if (!Array.isArray(keywordIds)) keywordIds = [];

    const cleanIds = [...new Set(keywordIds.filter(Boolean))];

    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    // This magic line replaces ALL keywords in one query!
    await product.setKeywords(cleanIds.length > 0 ? cleanIds : [], {
      transaction: t,
    });

    await t.commit();

    // Fetch fresh keywords with category
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        {
          model: Keyword,
          as: "keywords",
          attributes: ["id", "keyword"],
          through: { attributes: [] }, // don't return join table fields
          include: [
            {
              model: Category,
              as: "categories",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
    });

    res.json({
      message: "Keywords updated successfully",
      keywords: updatedProduct.keywords || [],
    });
  } catch (error) {
    await t.rollback();
    console.error("replaceAllKeywordsForProduct error:", error);
    res.status(500).json({ message: "Failed to update keywords" });
  }
};
// controller/productController.js

exports.getTopSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const salesMap = new Map(); // productId → total sold quantity

    const processItemsArray = (items) => {
      if (!Array.isArray(items)) return;

      items.forEach((item) => {
        const id = item.productId;
        const qty = Number(item.quantity) || 0;
        if (id && qty > 0) {
          salesMap.set(id, (salesMap.get(id) || 0) + qty);
        }
      });
    };

    // Step 1: Fetch all Quotations (using the correct 'products' column)
    const quotations = await Quotation.findAll({
      attributes: ["quotationId", "products"],
      raw: true,
    });

    // Process quotations
    quotations.forEach((q) => {
      if (q.products) {
        let items;
        try {
          items =
            typeof q.products === "string"
              ? JSON.parse(q.products)
              : q.products;
        } catch (e) {
          console.warn(
            "Failed to parse quotation products:",
            q.quotationId,
            e.message
          );
          return;
        }
        processItemsArray(items);
      }
    });

    // Step 2: Fetch all Orders
    const orders = await Order.findAll({
      attributes: ["id", "products", "quotationId"],
      raw: true,
    });

    // Build map: quotationId → products array (for fallback)
    const quotationProductsMap = new Map();
    quotations.forEach((q) => {
      if (q.products) {
        try {
          const items =
            typeof q.products === "string"
              ? JSON.parse(q.products)
              : q.products;
          if (Array.isArray(items)) {
            quotationProductsMap.set(q.quotationId, items);
          }
        } catch (e) {
          // skip malformed
        }
      }
    });

    // Process orders
    orders.forEach((order) => {
      let itemsToUse = null;

      // Priority 1: Use order's own products if present
      if (order.products && order.products !== null) {
        try {
          const parsed =
            typeof order.products === "string"
              ? JSON.parse(order.products)
              : order.products;
          if (Array.isArray(parsed) && parsed.length > 0) {
            itemsToUse = parsed;
          }
        } catch (e) {
          console.warn("Failed to parse order products:", order.id);
        }
      }

      // Priority 2: Fallback to linked quotation's products
      if (
        !itemsToUse &&
        order.quotationId &&
        quotationProductsMap.has(order.quotationId)
      ) {
        itemsToUse = quotationProductsMap.get(order.quotationId);
      }

      if (itemsToUse) {
        processItemsArray(itemsToUse);
      }
    });

    // Convert to sorted array: highest sold first
    const salesArray = Array.from(salesMap, ([productId, totalSold]) => ({
      productId,
      totalSold, // ← Clear, meaningful name
    })).sort((a, b) => b.totalSold - a.totalSold);

    if (salesArray.length === 0) {
      return res.status(200).json({ data: [], total: 0 });
    }

    // Get top 50 candidates to enrich
    const topProductIds = salesArray.slice(0, 50).map((s) => s.productId);

    // Fetch full product details with associations
    const products = await Product.findAll({
      where: {
        productId: { [Op.in]: topProductIds },
      },
      order: [["name", "ASC"]],
      include: [
        {
          model: Keyword,
          as: "keywords",
          attributes: ["id", "keyword"],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["categoryId", "name", "slug"],
            },
          ],
        },
      ],
    });

    // Enrich with metaDetails, images, keywords, and totalSold
    const enrichedProducts = products.map((product) => {
      const raw = product.toJSON();

      const metaObj = raw.meta
        ? typeof raw.meta === "string"
          ? JSON.parse(raw.meta)
          : raw.meta
        : {};
      const images = raw.images
        ? typeof raw.images === "string"
          ? JSON.parse(raw.images)
          : raw.images
        : [];

      const metaDetails = Object.entries(metaObj).map(([id, value]) => ({
        id,
        title: "Unknown Field",
        slug: id,
        value: value != null ? String(value) : "",
        fieldType: "text",
        unit: null,
      }));

      const keywords = (raw.keywords || []).map((k) => ({
        id: k.id,
        keyword: k.keyword,
        categories: k.categories
          ? {
              categoryId: k.categories.categoryId,
              name: k.categories.name,
              slug: k.categories.slug,
            }
          : null,
      }));

      const totalSold =
        salesArray.find((s) => s.productId === raw.productId)?.totalSold || 0;

      return {
        ...raw,
        images,
        meta: metaObj,
        metaDetails,
        keywords,
        totalSold, // ← This is the new clear field
      };
    });

    // Final sort by totalSold and apply limit
    const finalTopProducts = enrichedProducts
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);

    res.status(200).json({
      data: finalTopProducts,
      total: finalTopProducts.length,
    });
  } catch (err) {
    console.error("getTopSellingProducts error:", err);
    res.status(500).json({
      message: "Failed to fetch top selling products",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
