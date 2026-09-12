const { Op } = require("sequelize");
const sequelize = require("../../config/database");
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
} = require("../../models");
const { uploadToFtp } = require("../../middleware/upload");

const {
  ensureAssociations,
  parseJsonSafely,
  COMPANY_CODE_META_ID,
  generateProductCode,
  getKeywordInclude,
  normalizeKeywords,
  buildMetaDetails,
  fetchMetaMapForProducts,
  enrichProducts,
  cleanKeywordIds,
} = require("./helpers/product.helpers");

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
async function createProduct(req) {
  const t = await sequelize.transaction();

  try {
    ensureAssociations();

    const {
      name,
      product_code: inputProductCode,
      quantity = 0,
      isMaster,
      masterProductId,
      variantOptions: variantOptionsInput,
      variantKey,
      skuSuffix,
      meta: metaInput,
      isFeatured = false,
      status,
      keywordIds = [],
      ...restFields
    } = req.body;

    // Parse meta
    let metaObj = {};
    if (metaInput) {
      metaObj = parseJsonSafely(metaInput, {}, "meta");
    }

    // Upload images — ALWAYS to product_images folder (like in orderController)
    let imageUrls = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToFtp(file.buffer, file.originalname, {
            remoteDir: "/product_images",
          });
          imageUrls.push(url);
        } catch (uploadErr) {
          console.error(
            "Image upload failed for:",
            file.originalname,
            uploadErr,
          );
          // Continue with other files instead of failing the whole request
        }
      }
    }

    // 1. Prepare base product data
    const productData = {
      name: name?.trim() || "Unnamed Product",
      quantity: parseInt(quantity, 10) || 0,
      images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      meta: Object.keys(metaObj).length > 0 ? metaObj : null,
      isFeatured: isFeatured === "true" || isFeatured === true,
      status: status || (quantity > 0 ? "active" : "out_of_stock"),
      description: restFields.description?.trim() || null,
      tax: restFields.tax ? parseFloat(restFields.tax) : null,
      alert_quantity: restFields.alert_quantity
        ? parseInt(restFields.alert_quantity, 10)
        : null,
      categoryId: restFields.categoryId || null,
      brandId: restFields.brandId || null,
      vendorId: restFields.vendorId || null,
      brand_parentcategoriesId: restFields.brand_parentcategoriesId || null,
      // product_code will be set below
    };

    // 2. Handle product_code – auto-generate if missing
    let finalProductCode = (inputProductCode || "").trim();

    if (!finalProductCode) {
      try {
        finalProductCode = await generateProductCode({
          brandId: restFields.brandId,
          categoryId: restFields.categoryId,
          companyCode: metaObj?.[COMPANY_CODE_META_ID] || null,
          transaction: t,
        });
      } catch (err) {
        await t.rollback();
        throw {
          status: 500,
          message: "Failed to auto-generate product code",
          error: err.message,
        };
      }
    }

    // 3. Ensure uniqueness with simple collision handling
    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
      const duplicate = await Product.findOne({
        where: { product_code: finalProductCode },
        transaction: t,
      });

      if (!duplicate) break;

      finalProductCode =
        finalProductCode.replace(/-\d+$/, "") + `-${attempt + 2}`;
      attempt++;
    }

    if (attempt >= maxAttempts) {
      await t.rollback();
      throw {
        status: 409,
        message:
          "Could not generate a unique product code after multiple attempts",
      };
    }

    // Assign the final safe code
    productData.product_code = finalProductCode;

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
        { transaction: t },
      );
    }
    // CASE 2: Variant of existing master
    else if (masterProductId) {
      const master = await Product.findOne({
        where: { productId: masterProductId, isMaster: true },
        transaction: t,
      });

      if (!master) {
        await t.rollback();
        throw { status: 400, message: "Master product not found" };
      }

      const variantOpts = parseJsonSafely(variantOptionsInput, {});

      const generatedVariantKey = Object.values(variantOpts)
        .filter(Boolean)
        .join(" ");

      const generatedSkuSuffix = generatedVariantKey
        ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, "-")}`
        : "";

      finalProduct = await Product.create(
        {
          ...productData, // ← already has correct product_code
          name:
            name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
          masterProductId: master.productId,
          isMaster: false,
          variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
          variantKey: generatedVariantKey || variantKey || null,
          skuSuffix: generatedSkuSuffix || skuSuffix || null,
          categoryId: restFields.categoryId || master.categoryId,
          brandId: restFields.brandId || master.brandId,
          vendorId: restFields.vendorId || master.vendorId,
          brand_parentcategoriesId:
            restFields.brand_parentcategoriesId ||
            master.brand_parentcategoriesId,
          images:
            imageUrls.length > 0 ? JSON.stringify(imageUrls) : master.images,
          meta: Object.keys(metaObj).length > 0 ? metaObj : master.meta,
          description: restFields.description?.trim() || master.description,
        },
        { transaction: t },
      );
    }
    // CASE 3: Standalone / normal product
    else {
      finalProduct = await Product.create(
        { ...productData, isMaster: false },
        { transaction: t },
      );
    }

    // Attach keywords
    const cleanedKeywordIds = cleanKeywordIds(keywordIds);

    if (cleanedKeywordIds.length > 0) {
      await finalProduct.setKeywords(cleanedKeywordIds, { transaction: t });
    }

    await t.commit();

    // Return fresh product with relations
    const createdProduct = await Product.findByPk(finalProduct.productId, {
      include: [getKeywordInclude()],
    });

    const keywords = normalizeKeywords(createdProduct.keywords);

    return {
      message: "Product created successfully",
      product: {
        ...createdProduct.toJSON(),
        images: createdProduct.images ? JSON.parse(createdProduct.images) : [],
        meta: createdProduct.meta || {},
        keywords,
        variantOptions: createdProduct.variantOptions || {},
        variantKey: createdProduct.variantKey || null,
        skuSuffix: createdProduct.skuSuffix || null,
        isMaster: !!createdProduct.isMaster,
        isVariant: !!createdProduct.masterProductId,
      },
    };
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback().catch(() => {});
    }
    if (error.status) throw error;
    throw {
      status: 500,
      message: "Failed to create product",
      error: error.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
async function updateProduct(req) {
  const t = await sequelize.transaction();

  try {
    const { productId } = req.params;

    // Fetch existing product
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      throw { status: 404, message: "Product not found" };
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

    // 1. Parse meta safely
    let metaObj = {};
    if (metaInput) {
      metaObj = parseJsonSafely(metaInput, {}, "meta");
    }

    // 2. Handle images
    let currentImages = [];
    if (product.images) {
      currentImages = parseJsonSafely(product.images, [], "existing images");
    }

    // Parse imagesToDelete
    let imagesToDelete = [];
    if (deleteInput) {
      try {
        imagesToDelete =
          typeof deleteInput === "string"
            ? JSON.parse(deleteInput)
            : Array.isArray(deleteInput)
              ? deleteInput
              : [];
      } catch (e) {
        console.error("Failed to parse imagesToDelete:", deleteInput);
      }
    }

    // Remove deleted images
    currentImages = currentImages.filter(
      (url) => !imagesToDelete.includes(url),
    );

    // Upload new images
    if (req.files?.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToFtp(file.buffer, file.originalname, {
            remoteDir: "/product_images",
          });
          currentImages.push(url);
        } catch (uploadErr) {
          console.error("Image upload failed:", file.originalname, uploadErr);
        }
      }
    }

    // 3. Prepare update data
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
      tax:
        restFields.tax !== undefined ? parseFloat(restFields.tax) : product.tax,
      alert_quantity:
        restFields.alert_quantity !== undefined
          ? parseInt(restFields.alert_quantity, 10)
          : product.alert_quantity,
      categoryId: restFields.categoryId || product.categoryId,
      brandId: restFields.brandId || product.brandId,
      vendorId: restFields.vendorId || product.vendorId,
      brand_parentcategoriesId:
        restFields.brand_parentcategoriesId || product.brand_parentcategoriesId,
    };

    // 4. Master / Variant Logic
    if (isMaster && !product.isMaster) {
      const hasVariants = await Product.count({
        where: { masterProductId: product.productId },
        transaction: t,
      });

      if (hasVariants > 0) {
        await t.rollback();
        throw {
          status: 400,
          message: "Cannot convert to master product: it already has variants",
        };
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
        throw { status: 400, message: "Master product not found" };
      }

      const variantOpts = parseJsonSafely(variantOptionsInput, {});
      const generatedVariantKey = Object.values(variantOpts)
        .filter(Boolean)
        .join(" ");

      const generatedSkuSuffix = generatedVariantKey
        ? `-${generatedVariantKey.toUpperCase().replace(/\s+/g, "-")}`
        : "";

      Object.assign(updateData, {
        masterProductId: master.productId,
        isMaster: false,
        variantOptions: Object.keys(variantOpts).length ? variantOpts : null,
        variantKey: generatedVariantKey || variantKey || null,
        skuSuffix: generatedSkuSuffix || skuSuffix || null,
        name: name?.trim() || `${master.name} - ${generatedVariantKey}`.trim(),
        categoryId: restFields.categoryId || master.categoryId,
        brandId: restFields.brandId || master.brandId,
      });
    } else {
      updateData.isMaster = isMaster;

      if (!isMaster) {
        const finalKey =
          variantKey ||
          (variantOptionsInput
            ? Object.values(parseJsonSafely(variantOptionsInput, {}))
                .filter(Boolean)
                .join(" ")
            : product.variantKey);

        const finalSuffix = finalKey
          ? `-${finalKey.toUpperCase().replace(/\s+/g, "-")}`
          : product.skuSuffix;

        updateData.variantKey = finalKey;
        updateData.skuSuffix = finalSuffix;
        updateData.variantOptions = variantOptionsInput
          ? parseJsonSafely(variantOptionsInput, {})
          : product.variantOptions;
      } else {
        updateData.variantOptions = null;
        updateData.variantKey = null;
        updateData.skuSuffix = null;
        updateData.masterProductId = null;
      }
    }

    // 5. Update the product
    await product.update(updateData, { transaction: t });

    // 6. Update keywords
    const cleanedKeywordIds = cleanKeywordIds(keywordIds);
    await product.setKeywords(cleanedKeywordIds, { transaction: t });

    // 7. Fetch updated product BEFORE committing transaction
    const updated = await Product.findByPk(productId, {
      transaction: t,
      include: [
        {
          model: Keyword,
          as: "keywords",
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

    // Commit transaction
    await t.commit();

    // Prepare keywords for response
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

    return {
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
    };
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback().catch((rollbackErr) => {
        console.error("Rollback error:", rollbackErr);
      });
    }
    if (error.status) throw error;
    throw {
      status: 500,
      message: "Failed to update product",
      error: error.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PRODUCTS (OPTIMIZED FOR INVENTORY)
// ─────────────────────────────────────────────────────────────────────────────
async function getAllProducts(req) {
  ensureAssociations();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const searchTerm = req.query.search?.trim();
  const tab = req.query.tab || "all";
  const lowStockThreshold = parseInt(req.query.lowStockThreshold) || 10;

  let whereClause = {};

  // === Search ===
  if (searchTerm) {
    const pattern = `%${searchTerm.toLowerCase()}%`;
    whereClause[Op.or] = [
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("Product.name")),
        Op.like,
        pattern,
      ),
      sequelize.where(
        sequelize.fn(
          "LOWER",
          sequelize.fn(
            "JSON_EXTRACT",
            sequelize.col("Product.meta"),
            sequelize.literal(`'$."d11da9f9-3f2e-4536-8236-9671200cca4a"'`),
          ),
        ),
        Op.like,
        pattern,
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("keywords.keyword")),
        Op.like,
        pattern,
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("keywords.categories.name")),
        Op.like,
        pattern,
      ),
      { product_code: { [Op.like]: pattern } },
    ];
  }

  // === Tab filtering ===
  if (tab === "in-stock") {
    whereClause.quantity = { [Op.gt]: 0 };
  } else if (tab === "out-of-stock") {
    whereClause.quantity = 0;
  } else if (tab === "low-stock") {
    whereClause.quantity = { [Op.gt]: 0, [Op.lte]: lowStockThreshold };
  }

  // === ORDERING: Priority to latest InventoryHistory ===
  const order = [
    // 1. Most recently updated inventory first (NULLS LAST)
    [
      sequelize.literal(`
          COALESCE(
            (SELECT MAX(createdAt) 
             FROM inventory_history 
             WHERE inventory_history.productId = \`Product\`.\`productId\`),
            '1970-01-01'
          )
        `),
      "DESC",
    ],
    // 2. In-stock before out-of-stock
    [
      sequelize.literal(
        `CASE WHEN \`Product\`.\`quantity\` > 0 THEN 0 ELSE 1 END`,
      ),
      "ASC",
    ],
    // 3. Product updatedAt
    ["updatedAt", "DESC"],
    // 4. Name
    ["name", "ASC"],
  ];

  const { count: totalProducts, rows: products } =
    await Product.findAndCountAll({
      where: whereClause,
      order,
      offset,
      limit,
      distinct: true,
      subQuery: false,
      include: [getKeywordInclude()],
    });

  if (totalProducts === 0) {
    return {
      data: [],
      pagination: { total: 0, page, limit, totalPages: 0 },
    };
  }

  const enrichedProducts = await enrichProducts(products);

  return {
    data: enrichedProducts,
    pagination: {
      total: totalProducts,
      page,
      limit,
      totalPages: Math.ceil(totalProducts / limit),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
async function getProductById(req) {
  ensureAssociations();
  const { productId } = req.params;

  const product = await Product.findByPk(productId, {
    include: [getKeywordInclude()],
  });

  if (!product) {
    throw { status: 404, message: "Product not found" };
  }

  const raw = product.toJSON();

  // ── Safe JSON parse helper ────────────────────────────────────────
  const safeJsonParse = (value, fallback = []) => {
    if (value == null) return fallback;
    if (typeof value !== "string") return value; // already object/array

    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "null" || trimmed === "undefined") {
      return fallback;
    }

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed]; // normalize to array
    } catch (err) {
      return fallback;
    }
  };

  // ── Parse fields safely ────────────────────────────────────────────
  const images = safeJsonParse(raw.images, []);
  const metaObj = safeJsonParse(raw.meta, {});
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

  const keywords = normalizeKeywords(raw.keywords);

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
    masterProductId: raw.masterProductId || raw.productId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
async function deleteProduct(req) {
  const product = await Product.findByPk(req.params.productId);
  if (!product) {
    throw { status: 404, message: "Product not found" };
  }
  await product.destroy();
  return { message: "Product deleted successfully" };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRODUCTS BY CATEGORY
// ─────────────────────────────────────────────────────────────────────────────
async function getProductsByCategory(req) {
  const { categoryId } = req.params;
  const { page = 1, limit = 50, search } = req.query;

  if (!categoryId) {
    throw { status: 400, message: "Category ID is required." };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    throw { status: 400, message: "Invalid pagination parameters." };
  }

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
        pattern,
      ),

      // Company code in JSON meta
      sequelize.where(
        sequelize.fn(
          "LOWER",
          sequelize.fn(
            "JSON_EXTRACT",
            sequelize.col("Product.meta"),
            sequelize.literal("'$.d11da9f9-3f2e-4536-8236-9671200cca4a'"), // ← literal string + single quotes
          ),
        ),
        Op.like,
        pattern,
      ),

      // Keywords
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("keywords.keyword")),
        Op.like,
        pattern,
      ),

      // Category names (via keyword → category)
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("keywords.categories.name")),
        Op.like,
        pattern,
      ),
    ];
  }

  const { count: total, rows: products } = await Product.findAndCountAll({
    where,
    offset,
    limit: limitNum,
    order: [["name", "ASC"]],
    include: [getKeywordInclude()],
    subQuery: false, // Important for correct count with nested includes
  });

  if (total === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
      },
    };
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
    const images = parseJsonSafely(raw.images, [], `product ${raw.id} images`);

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
    const keywords = normalizeKeywords(raw.keywords);

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

  return {
    data: enriched,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRODUCTS BY BRAND
// ─────────────────────────────────────────────────────────────────────────────
async function getProductsByBrand(req) {
  const { brandId } = req.params;
  const { page = 1, limit = 50, search } = req.query;

  if (!brandId) {
    throw { status: 400, message: "Brand ID is required." };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
    throw { status: 400, message: "Invalid pagination parameters." };
  }

  ensureAssociations();

  // ── Base where clause ───────────────────────────────────────────────
  const where = { brandId };

  // ── Search support – fully case-insensitive, multi-word AND ──────────
  if (search && search.trim()) {
    const searchWords = search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (searchWords.length > 0) {
      where[Op.and] = searchWords.map((word) => {
        const pattern = `%${word}%`;

        return {
          [Op.or]: [
            // Product name
            sequelize.where(
              sequelize.fn("LOWER", sequelize.col("Product.name")),
              Op.like,
              pattern,
            ),

            // Model code from meta
            sequelize.where(
              sequelize.fn(
                "LOWER",
                sequelize.fn(
                  "JSON_EXTRACT",
                  sequelize.col("Product.meta"),
                  sequelize.literal(
                    `'$."d11da9f9-3f2e-4536-8236-9671200cca4a"'`,
                  ),
                ),
              ),
              Op.like,
              pattern,
            ),

            // Keywords
            sequelize.where(
              sequelize.fn("LOWER", sequelize.col("keywords.keyword")),
              Op.like,
              pattern,
            ),

            // Category names
            sequelize.where(
              sequelize.fn("LOWER", sequelize.col("keywords.categories.name")),
              Op.like,
              pattern,
            ),
          ],
        };
      });
    }
  }

  const { count: totalProducts, rows: products } =
    await Product.findAndCountAll({
      where,
      offset,
      limit: limitNum,
      order: [["name", "ASC"]],
      include: [getKeywordInclude()],
      subQuery: false, // Important for correct count with nested includes
    });

  if (totalProducts === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
      },
    };
  }

  // ── Fetch all meta definitions once (small table) ───────────────────
  const metaDefs = await ProductMeta.findAll({
    attributes: ["id", "title", "slug", "fieldType", "unit"],
  });

  const metaMap = Object.fromEntries(
    metaDefs.map((m) => {
      const def = m.toJSON();
      return [def.id, def];
    }),
  );

  // ── Enrich products ─────────────────────────────────────────────────
  const enrichedProducts = products.map((product) => {
    const raw = product.toJSON();

    // Safely parse JSON fields
    const metaObj = parseJsonSafely(
      raw.meta,
      {},
      `product ${raw.id || raw.productId} meta`,
    );
    const images = parseJsonSafely(
      raw.images,
      [],
      `product ${raw.id || raw.productId} images`,
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
    const keywords = normalizeKeywords(raw.keywords);

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

  return {
    data: enrichedProducts,
    pagination: {
      total: totalProducts,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD STOCK
// ─────────────────────────────────────────────────────────────────────────────
async function addStock(req) {
  const { productId } = req.params;
  const { quantity, orderNo, userId, message: customMessage } = req.body;

  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    throw { status: 400, message: "Valid quantity is required" };
  }

  const qty = Number(quantity);

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
      { transaction: t },
    );

    return { product, history };
  });

  return {
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
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOVE STOCK
// ─────────────────────────────────────────────────────────────────────────────
async function removeStock(req) {
  const { productId } = req.params;
  const { quantity, orderNo, userId, message: customMessage } = req.body;

  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    throw { status: 400, message: "Valid quantity is required" };
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
        { transaction: t },
      );

      return { product, history };
    });

    return {
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
    };
  } catch (error) {
    const status = error.message === "Insufficient stock" ? 400 : 500;
    throw { status, message: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET HISTORY BY PRODUCT ID
// ─────────────────────────────────────────────────────────────────────────────
async function getHistoryByProductId(req) {
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

  return {
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
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET LOW STOCK PRODUCTS (first version – kept for compatibility)
// ─────────────────────────────────────────────────────────────────────────────
async function getLowStockProducts(req) {
  ensureAssociations();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;

  const threshold = parseInt(req.query.threshold) || 20;

  const whereClause = {
    quantity: {
      [Op.lte]: threshold,
    },
  };

  const { count: totalLowStock, rows: products } =
    await Product.findAndCountAll({
      where: whereClause,
      order: [
        ["quantity", "ASC"],
        ["updatedAt", "DESC"],
      ],
      offset,
      limit,
      distinct: true,
      subQuery: false,
      include: [getKeywordInclude()],
    });

  // ===== META ENRICHMENT =====
  const metaIds = new Set();

  products.forEach((p) => {
    const meta =
      typeof p.meta === "string" ? JSON.parse(p.meta || "{}") : p.meta || {};

    Object.keys(meta).forEach((id) => metaIds.add(id));
  });

  const metaDefs =
    metaIds.size > 0
      ? await ProductMeta.findAll({
          where: {
            id: {
              [Op.in]: [...metaIds],
            },
          },
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        })
      : [];

  const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));

  const enrichedProducts = products.map((product) => {
    const raw = product.toJSON();

    const meta =
      typeof raw.meta === "string"
        ? JSON.parse(raw.meta || "{}")
        : raw.meta || {};

    const images =
      typeof raw.images === "string"
        ? JSON.parse(raw.images || "[]")
        : raw.images || [];

    const metaDetails = Object.entries(meta).map(([id, value]) => {
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

    return {
      ...raw,
      images,
      meta,
      metaDetails,
      quantity: Number(raw.quantity) || 0,
    };
  });

  return {
    success: true,
    totalLowStock,
    threshold,
    data: enrichedProducts,
    pagination: {
      total: totalLowStock,
      page,
      limit,
      totalPages: Math.ceil(totalLowStock / limit),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET LOW STOCK PRODUCTS (second, more detailed version – preferred)
// ─────────────────────────────────────────────────────────────────────────────
async function getLowStockProductsV2(req) {
  ensureAssociations();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const threshold = parseInt(req.query.threshold) || 20;

  // ================= FETCH LOW STOCK =================
  const { count: totalLowStock, rows: products } =
    await Product.findAndCountAll({
      where: {
        quantity: {
          [Op.lte]: threshold,
        },
      },
      attributes: [
        "productId",
        "name",
        "quantity",
        "alert_quantity",
        "product_code",
        "images",
        "status",
        "meta",
        "updatedAt",
      ],
      order: [["quantity", "ASC"]],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

  if (totalLowStock === 0) {
    return {
      success: true,
      totalLowStock: 0,
      threshold,
      products: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  // ================= META ENRICHMENT =================
  const metaIds = new Set();

  products.forEach((p) => {
    const meta = parseJsonSafely(p.meta, {});
    Object.keys(meta || {}).forEach((key) => metaIds.add(key));
  });

  const metaDefs =
    metaIds.size > 0
      ? await ProductMeta.findAll({
          where: { id: { [Op.in]: Array.from(metaIds) } },
          attributes: ["id", "title", "slug", "fieldType", "unit"],
        })
      : [];

  const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));

  // ================= ENRICH PRODUCTS =================
  const enriched = products.map((p) => {
    const raw = p.toJSON ? p.toJSON() : p;

    const metaObj = parseJsonSafely(raw.meta, {});
    const images = parseJsonSafely(raw.images, []);

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

    return {
      productId: raw.productId,
      name: raw.name,
      quantity: Number(raw.quantity) || 0,
      alert_quantity: Number(raw.alert_quantity || threshold),
      product_code: raw.product_code,
      status: raw.status,

      images,
      meta: metaObj,
      metaDetails,

      stockStatus:
        raw.quantity === 0
          ? "OUT_OF_STOCK"
          : raw.quantity <= threshold
            ? "LOW_STOCK"
            : "OK",

      updatedAt: raw.updatedAt,
    };
  });

  return {
    success: true,
    totalLowStock,
    threshold,
    products: enriched,
    pagination: {
      total: totalLowStock,
      page,
      limit,
      totalPages: Math.ceil(totalLowStock / limit),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
async function searchProducts(req) {
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
        pattern,
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("Product.product_code")),
        Op.like,
        pattern,
      ),
      // Search inside meta → model code / company code (UUID key)
      sequelize.where(
        sequelize.fn(
          "LOWER",
          sequelize.fn(
            "JSON_EXTRACT",
            sequelize.col("Product.meta"),
            sequelize.literal("'$.\"d11da9f9-3f2e-4536-8236-9671200cca4a\"'"),
          ),
        ),
        Op.like,
        pattern,
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
    ],
    order: [["name", "ASC"]],
    limit: 100, // ← reasonable default for search – adjust as needed
  });

  if (products.length === 0) {
    return [];
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
      `product ${raw.productId} images`,
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
      variantOptions: raw.variantOptions || {},
      variantKey: raw.variantKey || null,
      skuSuffix: raw.skuSuffix || null,
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
      masterProductId: raw.masterProductId || raw.productId,
    };
  });

  return enrichedProducts;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PRODUCT CODES
// ─────────────────────────────────────────────────────────────────────────────
async function getAllProductCodes() {
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
      productData.metaDetails = Object.keys(productData.meta).map((metaId) => {
        const metaField = productData.product_metas.find(
          (mf) => mf.id === metaId,
        );
        return {
          id: metaId,
          title: metaField ? metaField.title : "Unknown",
          slug: metaField ? metaField.slug : null,
          value: productData.meta[metaId],
          fieldType: metaField ? metaField.fieldType : null,
          unit: metaField ? metaField.unit : null,
        };
      });
    }
    delete productData.product_metas;
    return productData;
  });

  return {
    success: true,
    count: products.length,
    data: enrichedProducts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE FEATURED STATUS
// ─────────────────────────────────────────────────────────────────────────────
async function updateProductFeatured(req) {
  const { productId } = req.params;
  const { isFeatured } = req.body;

  if (typeof isFeatured !== "boolean") {
    throw { status: 400, message: "isFeatured must be a boolean" };
  }

  const product = await Product.findOne({ where: { productId } });
  if (!product) {
    throw { status: 404, message: "Product not found" };
  }

  product.isFeatured = isFeatured;
  await product.save();

  return {
    message: "Product featured status updated successfully",
    product,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRODUCTS BY IDS
// ─────────────────────────────────────────────────────────────────────────────
async function getProductsByIds(req) {
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw { status: 400, message: "productIds must be a non-empty array" };
  }

  if (productIds.some((id) => !id || typeof id !== "string")) {
    throw { status: 400, message: "All productIds must be non-empty strings" };
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
    include: [getKeywordInclude()],
  });

  // Check for missing products
  const foundProductIds = products.map((p) => p.productId);
  const missingIds = productIds.filter((id) => !foundProductIds.includes(id));

  if (missingIds.length > 0) {
    throw {
      status: 404,
      message: `Products not found for IDs: ${missingIds.join(", ")}`,
    };
  }

  // ──────── ENRICHMENT (same logic as getAllProducts) ────────
  const enrichedProducts = await enrichProducts(products);

  // ──────── RESPONSE (consistent with getAllProducts style) ────────
  return {
    data: enrichedProducts,
    pagination: {
      total: enrichedProducts.length,
      page: 1,
      limit: enrichedProducts.length,
      totalPages: 1,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PRODUCT CODES BRAND-WISE
// ─────────────────────────────────────────────────────────────────────────────
async function getAllProductCodesBrandWise() {
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

  return {
    success: true,
    count: products.length,
    data: grouped,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH CREATE PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
async function batchCreateProducts(req) {
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
      throw { status: 400, message: "Send 1–50 products" };
    }

    // Validate common fields
    if (!categoryId || !brandId) {
      throw { status: 400, message: "categoryId and brandId required" };
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
          { transaction: t },
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
      throw { status: 400, message: "All failed", errors };
    }

    if (results.length > 0) {
      await t.commit();
    } else {
      await t.rollback();
    }

    return {
      message: `${results.length} products created`,
      successCount: results.length,
      failedCount: errors.length,
      created: results,
      errors,
    };
  } catch (err) {
    if (t && !t.finished) await t.rollback().catch(() => {});
    if (err.status) throw err;
    throw { status: 500, message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK PRODUCT CODE
// ─────────────────────────────────────────────────────────────────────────────
async function checkproductCode(req) {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    throw { status: 400, exists: false, message: "Code is required" };
  }

  // Case-insensitive check (optional, but recommended for consistency)
  const existing = await Product.findOne({
    where: {
      product_code: code.trim(),
    },
    attributes: ["product_code"], // only fetch the code, minimal data
  });

  return { exists: !!existing };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRODUCT WITH VARIANTS
// ─────────────────────────────────────────────────────────────────────────────
async function getProductWithVariants(req) {
  const { productId } = req.params;

  const master = await Product.findByPk(productId);
  if (!master) {
    throw { status: 404, message: "Not found" };
  }

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

  // Simple enrich (reuse parse helpers)
  const enrichProduct = (p) => {
    const raw = p.toJSON ? p.toJSON() : p;
    return {
      ...raw,
      images: parseJsonSafely(raw.images, []),
      meta: parseJsonSafely(raw.meta, {}),
      variantOptions: raw.variantOptions || {},
      variantKey: raw.variantKey || null,
      skuSuffix: raw.skuSuffix || null,
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
    };
  };

  const enrichedVariants = variants.map((v) => enrichProduct(v));

  return {
    master: enrichProduct(mainProduct),
    variants: enrichedVariants,
    totalVariants: enrichedVariants.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE VARIANT
// ─────────────────────────────────────────────────────────────────────────────
async function createVariant(req) {
  const t = await sequelize.transaction();
  try {
    const { masterId } = req.params;
    const { name, variantOptions, meta, quantity = 0 } = req.body;

    const master = await Product.findByPk(masterId, { transaction: t });
    if (!master || !master.isMaster) {
      await t.rollback();
      throw { status: 400, message: "Invalid master product" };
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
      { transaction: t },
    );

    await t.commit();
    return { message: "Variant created", variant };
  } catch (e) {
    if (t && !t.finished) await t.rollback().catch(() => {});
    if (e.status) throw e;
    throw { status: 500, message: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYWORD MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
async function addKeywordsToProduct(req) {
  const { productId } = req.params;
  const { keywordIds } = req.body; // array of keyword UUIDs

  if (!Array.isArray(keywordIds) || keywordIds.length === 0) {
    throw { status: 400, message: "keywordIds array is required" };
  }

  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      await t.rollback();
      throw { status: 404, message: "Product not found" };
    }

    // Validate all keywordIds exist
    const keywords = await Keyword.findAll({
      where: { id: keywordIds },
    });

    if (keywords.length !== keywordIds.length) {
      await t.rollback();
      throw { status: 400, message: "One or more keyword IDs are invalid" };
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

    return {
      message: "Keywords added successfully",
      keywords: updatedKeywords.map((pk) => ({
        id: pk.Keyword.id,
        keyword: pk.Keyword.keyword,
        category: pk.Keyword.categories,
      })),
    };
  } catch (error) {
    if (t && !t.finished) await t.rollback().catch(() => {});
    if (error.status) throw error;
    throw { status: 500, message: error.message };
  }
}

async function removeKeywordFromProduct(req) {
  const { productId, keywordId } = req.params;

  const deleted = await ProductKeyword.destroy({
    where: { productId, keywordId },
  });

  if (deleted === 0) {
    throw { status: 404, message: "Keyword not associated with this product" };
  }

  return { message: "Keyword removed successfully" };
}

async function removeAllKeywordsFromProduct(req) {
  const { productId } = req.params;
  await ProductKeyword.destroy({ where: { productId } });
  return { message: "All keywords removed" };
}

async function replaceAllKeywordsForProduct(req) {
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
      throw { status: 404, message: "Product not found" };
    }

    // This magic line replaces ALL keywords in one query!
    await product.setKeywords(cleanIds.length > 0 ? cleanIds : [], {
      transaction: t,
    });

    await t.commit();

    // Fetch fresh keywords with category
    const updatedProduct = await Product.findByPk(productId, {
      include: [getKeywordInclude()],
    });

    return {
      message: "Keywords updated successfully",
      keywords: updatedProduct.keywords || [],
    };
  } catch (error) {
    if (t && !t.finished) await t.rollback().catch(() => {});
    if (error.status) throw error;
    throw { status: 500, message: "Failed to update keywords" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PRODUCT COUNT
// ─────────────────────────────────────────────────────────────────────────────
async function getProductCount() {
  const count = await Product.count();
  return {
    success: true,
    totalProducts: count,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET TOP SELLING PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
async function getTopSellingProducts(req) {
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
          typeof q.products === "string" ? JSON.parse(q.products) : q.products;
      } catch (e) {
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
          typeof q.products === "string" ? JSON.parse(q.products) : q.products;
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
      } catch (e) {}
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
    return { data: [], total: 0 };
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

  return {
    data: finalTopProducts,
    total: finalTopProducts.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK IMPORT BATCH PROCESSOR (moved here so worker can use it)
// ─────────────────────────────────────────────────────────────────────────────
async function processProductBatch(productsBatch, t, options = {}) {
  const { importJobId, selectedBrandId } = options;

  if (!selectedBrandId) {
    throw new Error("selectedBrandId is required for bulk import");
  }

  const created = [];
  const failed = [];
  const newCategories = new Set();
  const newVendors = new Set();

  // 1. Pre-fetch existing categories, vendors, brand
  const categoryNames = [
    ...new Set(
      productsBatch.map((p) => p.categoryName?.trim()).filter(Boolean),
    ),
  ];

  const vendorNames = [
    ...new Set(
      productsBatch
        .map((p) => p.vendorName?.trim() || "Unknown")
        .filter(Boolean),
    ),
  ];

  // Note: Vendor model is assumed to exist in the original codebase
  const Vendor =
    require("../../models").Vendor || require("../../models").Vendor;
  const Job = require("../../models").Job || require("../../models").Job;

  const [existingCategories, existingVendors, selectedBrand] =
    await Promise.all([
      Category.findAll({
        where: { name: categoryNames },
        attributes: ["id", "name", "slug"],
        transaction: t,
      }),
      Vendor
        ? Vendor.findAll({
            where: { name: vendorNames },
            attributes: ["id", "name"],
            transaction: t,
          })
        : [],
      Brand.findByPk(selectedBrandId, {
        attributes: ["id", "name"],
        transaction: t,
      }),
    ]);

  if (!selectedBrand) {
    throw new Error(`Selected brand ID ${selectedBrandId} not found`);
  }

  const categoryMap = new Map(
    existingCategories.map((c) => [c.name.trim().toLowerCase(), c]),
  );
  const vendorMap = new Map(
    (existingVendors || []).map((v) => [v.name.trim().toLowerCase(), v]),
  );

  // 2. Create missing categories & vendors
  for (const p of productsBatch) {
    const catName = p.categoryName?.trim() || "Uncategorized";
    const catKey = catName.toLowerCase();

    if (!categoryMap.has(catKey)) {
      // generateSlug assumed available in original project
      const slug =
        typeof generateSlug === "function"
          ? generateSlug(catName)
          : catName.toLowerCase().replace(/\s+/g, "-");
      const [newCat] = await Category.findOrCreate({
        where: { name: catName },
        defaults: {
          name: catName,
          slug,
          brandId: selectedBrand.id,
        },
        transaction: t,
      });
      categoryMap.set(catKey, newCat);
      newCategories.add(catName);
    }

    const venName = p.vendorName?.trim() || "Unknown";
    const venKey = venName.toLowerCase();

    if (Vendor && !vendorMap.has(venKey)) {
      const [newVen] = await Vendor.findOrCreate({
        where: { name: venName },
        defaults: { name: venName },
        transaction: t,
      });
      vendorMap.set(venKey, newVen);
      newVendors.add(venName);
    }
  }

  // 3. Create products
  for (const [index, p] of productsBatch.entries()) {
    const rowIndex = p.rowIndex || index + 2;

    try {
      if (!p.name?.trim() || !p.product_code?.trim()) {
        throw new Error("Product name and code are required");
      }

      // Duplicate check
      const existing = await Product.findOne({
        where: { product_code: p.product_code.trim() },
        transaction: t,
      });
      if (existing) {
        throw new Error(`Product code "${p.product_code}" already exists`);
      }

      const category = categoryMap.get(
        (p.categoryName?.trim() || "Uncategorized").toLowerCase(),
      );
      const vendor = vendorMap.get(
        (p.vendorName?.trim() || "Unknown").toLowerCase(),
      );

      const productData = {
        name: p.name.trim(),
        product_code: p.product_code.trim(),
        description: p.description?.trim() || null,
        quantity: Number(p.quantity) || 0,
        alert_quantity: p.alert_quantity ? Number(p.alert_quantity) : null,
        tax: p.tax ? Number(p.tax) : null,
        isFeatured: !!p.isFeatured,
        status: Number(p.quantity) > 0 ? "active" : "out_of_stock",
        images: Array.isArray(p.images) ? p.images : [],
        meta: p.meta || null,
        categoryId: category?.id || null,
        brandId: selectedBrand.id,
        vendorId: vendor?.id || null,
      };

      const newProduct = await Product.create(productData, { transaction: t });

      // Keywords (many-to-many)
      if (Array.isArray(p.keywords) && p.keywords.length > 0) {
        const keywords = p.keywords.map((k) => k.trim()).filter(Boolean);
        const keywordRecords = await Promise.all(
          keywords.map(async (kw) => {
            let record = await Keyword.findOne({
              where: { keyword: kw },
              transaction: t,
            });
            if (!record) {
              record = await Keyword.create(
                { keyword: kw },
                { transaction: t },
              );
            }
            return record;
          }),
        );

        await newProduct.setKeywords(
          keywordRecords.map((k) => k.id),
          { transaction: t },
        );
      }

      created.push({
        rowIndex,
        productId: newProduct.id,
        name: newProduct.name,
        product_code: newProduct.product_code,
      });
    } catch (err) {
      failed.push({
        rowIndex,
        product_code: p.product_code || "[missing]",
        name: p.name || "[missing]",
        error: err.message || "Unknown error",
      });
    }
  }

  // 4. Update job progress in transaction
  if (importJobId && Job) {
    const job = await Job.findByPk(importJobId, { transaction: t });
    if (job) {
      await job.update(
        {
          progress: {
            ...job.progress,
            processedRows:
              (job.progress?.processedRows || 0) + productsBatch.length,
            successCount: (job.progress?.successCount || 0) + created.length,
            failedCount: (job.progress?.failedCount || 0) + failed.length,
          },
          results: {
            ...job.results,
            newCategoriesCount:
              (job.results?.newCategoriesCount || 0) + newCategories.size,
            newVendorsCount:
              (job.results?.newVendorsCount || 0) + newVendors.size,
          },
          errorLog: [
            ...(job.errorLog || []),
            ...failed.map((f) => ({
              timestamp: new Date().toISOString(),
              row: f.rowIndex,
              message: f.error,
              data: { product_code: f.product_code, name: f.name },
            })),
          ],
        },
        { transaction: t },
      );
    }
  }

  return {
    created,
    failed,
    newCategories: newCategories.size,
    newBrands: 0,
    newVendors: newVendors.size,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK IMPORT PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
async function bulkImportProducts(req) {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    throw {
      status: 400,
      success: false,
      message: "products must be a non-empty array",
    };
  }

  if (products.length > 300) {
    throw {
      status: 400,
      success: false,
      message:
        "Maximum 300 products per request (use chunking or background import)",
    };
  }

  const t = await sequelize.transaction();

  try {
    const result = await processProductBatch(products, t);

    await t.commit();

    return {
      success: true,
      message: `${result.created.length} products created`,
      created: result.created,
      failed: result.failed,
      newCategories: result.newCategories,
      newBrands: result.newBrands,
      newVendors: result.newVendors,
      totalProcessed: products.length,
      successCount: result.created.length,
      failedCount: result.failed.length,
    };
  } catch (error) {
    await t.rollback();
    throw {
      status: 500,
      success: false,
      message: "Bulk import failed",
      error: error.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK INVENTORY UPDATE
// ─────────────────────────────────────────────────────────────────────────────
async function bulkInventoryUpdate(req) {
  const t = await sequelize.transaction();

  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      await t.rollback();
      throw { status: 400, message: "updates array is required" };
    }

    if (updates.length > 500) {
      await t.rollback();
      throw { status: 400, message: "Maximum 500 records per request" };
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      success: [],
      failed: [],
    };

    // UUID of Company Code meta field
    const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a";

    for (let index = 0; index < updates.length; index++) {
      const item = updates[index];

      let identifier = null;

      try {
        const {
          company_code,
          product_code,
          quantity,
          warehouse,
          selling_price,
          message: customMessage,
          userId,
        } = item;

        identifier = (company_code || product_code || "").toString().trim();

        if (!identifier) {
          throw new Error("Product Code / Company Code is required");
        }

        if (quantity === undefined || quantity === null || isNaN(quantity)) {
          throw new Error("Valid quantity is required");
        }

        const qty = Number(quantity);

        if (qty <= 0) {
          throw new Error("Quantity must be positive");
        }

        // Enable SQL logging temporarily
        sequelize.options.logging = console.log;

        const product = await Product.findOne({
          where: {
            [Op.or]: [
              // Direct product code search
              {
                product_code: identifier,
              },

              // Search inside meta JSON
              sequelize.literal(`
                JSON_UNQUOTE(
                  JSON_EXTRACT(
                    meta,
                    '$."${COMPANY_CODE_META_ID}"'
                  )
                ) = ${sequelize.escape(identifier)}
              `),
            ],
          },

          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!product) {
          throw new Error(`Product with code "${identifier}" not found`);
        }

        const oldQuantity = Number(product.quantity || 0);
        const newQuantity = oldQuantity + qty;

        const updateData = {
          quantity: newQuantity,
        };

        if (
          selling_price !== undefined &&
          selling_price !== null &&
          !isNaN(selling_price)
        ) {
          updateData.selling_price = Number(selling_price);
        }

        await product.update(updateData, {
          transaction: t,
        });

        const finalMessage =
          customMessage?.trim() ||
          `Bulk stock update (+${qty}) ${
            warehouse ? `at ${warehouse}` : ""
          } by System`;

        await InventoryHistory.create(
          {
            productId: product.productId,
            change: qty,
            quantityAfter: newQuantity,
            action: "add-stock",
            orderNo: null,
            userId: userId || null,
            message: finalMessage,
            warehouse: warehouse || null,
          },
          {
            transaction: t,
          },
        );

        results.success.push({
          productId: product.productId,
          product_code: product.product_code,
          company_code: identifier,
          oldQuantity,
          added: qty,
          newQuantity,
        });

        results.successCount++;
      } catch (err) {
        results.failed.push({
          identifier: identifier || "Unknown",
          error: err.message,
        });

        results.failedCount++;
      }
    }

    await t.commit();

    return {
      message: `Bulk inventory update completed. ${results.successCount} successful, ${results.failedCount} failed.`,
      successCount: results.successCount,
      failedCount: results.failedCount,
      success: results.success,
      failed: results.failed,
    };
  } catch (error) {
    if (t && !t.finished) await t.rollback().catch(() => {});
    if (error.status) throw error;
    throw {
      status: 500,
      message: "Bulk inventory update failed",
      error: error.message,
    };
  } finally {
    // disable SQL logging again
    sequelize.options.logging = false;
  }
}

module.exports = {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  getProductsByCategory,
  getProductsByBrand,
  addStock,
  removeStock,
  getHistoryByProductId,
  getLowStockProducts,
  getLowStockProductsV2,
  searchProducts,
  getAllProductCodes,
  updateProductFeatured,
  getProductsByIds,
  getAllProductCodesBrandWise,
  batchCreateProducts,
  checkproductCode,
  getProductWithVariants,
  createVariant,
  addKeywordsToProduct,
  removeKeywordFromProduct,
  removeAllKeywordsFromProduct,
  replaceAllKeywordsForProduct,
  getProductCount,
  getTopSellingProducts,
  processProductBatch,
  bulkImportProducts,
  bulkInventoryUpdate,
};
