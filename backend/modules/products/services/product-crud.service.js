const {
  Op,
  sequelize,
  Product,
  ProductMeta,
  Keyword,
  Category,
  uploadToFtp,
  COMPANY_CODE_META_ID,
  ensureAssociations,
  parseJsonSafely,
  generateProductCode,
} = require("./product.helpers");

// ==================== CREATE PRODUCT ====================
exports.createProduct = async (req, res) => {
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

    // Upload images
    // Upload images — ALWAYS to product_images folder (like in orderController)
    let imageUrls = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadToFtp(
            file.buffer,
            file.originalname,
            { remoteDir: "/product_images" }, // ← object
          );
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
    // ────────────────────────────────────────────────
    // 1. Prepare base product data
    // ────────────────────────────────────────────────
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

    // ────────────────────────────────────────────────
    // 2. Handle product_code – auto-generate if missing
    // ────────────────────────────────────────────────
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
        return res.status(500).json({
          message: "Failed to auto-generate product code",
          error: err.message,
        });
      }
    }

    // ────────────────────────────────────────────────
    // 3. Ensure uniqueness with simple collision handling
    // ────────────────────────────────────────────────
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
      return res.status(409).json({
        message:
          "Could not generate a unique product code after multiple attempts",
      });
    }

    // Assign the final safe code
    productData.product_code = finalProductCode;

    let finalProduct;

    // ────────────────────────────────────────────────
    // CASE 1: Master Product
    // ────────────────────────────────────────────────
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

    // ────────────────────────────────────────────────
    // CASE 2: Variant of existing master
    // ────────────────────────────────────────────────
    else if (masterProductId) {
      const master = await Product.findOne({
        where: { productId: masterProductId, isMaster: true },
        transaction: t,
      });

      if (!master) {
        await t.rollback();
        return res.status(400).json({ message: "Master product not found" });
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

    // ────────────────────────────────────────────────
    // CASE 3: Standalone / normal product
    // ────────────────────────────────────────────────
    else {
      finalProduct = await Product.create(
        { ...productData, isMaster: false },
        { transaction: t },
      );
    }

    // ────────────────────────────────────────────────
    // Attach keywords
    // ────────────────────────────────────────────────
    const cleanKeywordIds = Array.isArray(keywordIds)
      ? keywordIds.filter(Boolean)
      : typeof keywordIds === "string"
        ? keywordIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : [];

    if (cleanKeywordIds.length > 0) {
      await finalProduct.setKeywords(cleanKeywordIds, { transaction: t });
    }

    await t.commit();

    // ────────────────────────────────────────────────
    // Return fresh product with relations
    // ────────────────────────────────────────────────
    const createdProduct = await Product.findByPk(finalProduct.productId, {
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

    const keywords = (createdProduct.keywords || []).map((k) => ({
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
    });
  } catch (error) {
    await t.rollback();

    res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// ==================== UPDATE PRODUCT ====================
exports.updateProduct = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { productId } = req.params;

    // Fetch existing product
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
        return res.status(400).json({
          message: "Cannot convert to master product: it already has variants",
        });
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
    const cleanKeywordIds = Array.isArray(keywordIds)
      ? keywordIds.filter(Boolean)
      : typeof keywordIds === "string"
        ? keywordIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : [];

    await product.setKeywords(cleanKeywordIds, { transaction: t });

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

    return res.json({
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
    // Safe rollback - prevents the "Transaction cannot be rolled back" error
    if (t && !t.finished) {
      await t.rollback().catch((rollbackErr) => {
        console.error("Rollback error:", rollbackErr);
      });
    }

    return res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all products - OPTIMIZED FOR INVENTORY
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
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

    if (totalProducts === 0) {
      return res.json({
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    // === META ENRICHMENT (unchanged) ===
    const metaIds = new Set();
    products.forEach((p) => {
      const meta = parseJsonSafely(p.meta, {});
      if (meta && typeof meta === "object") {
        Object.keys(meta).forEach((key) => metaIds.add(key));
      }
    });

    const metaDefs =
      metaIds.size > 0
        ? await ProductMeta.findAll({
            where: { id: { [Op.in]: Array.from(metaIds) } },
            attributes: ["id", "title", "slug", "fieldType", "unit"],
          })
        : [];

    const metaMap = Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));

    // === Enrich Products ===
    const enrichedProducts = products.map((product) => {
      const raw = product.toJSON();
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
        quantity: Number(raw.quantity) || 0,
      };
    });

    res.json({
      data: enrichedProducts,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error(error);
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

// Get products by category
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
          pattern,
        ),

        // Company code in JSON meta
        // Inside the Op.or array, replace the company code line with:

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
        `product ${raw.id} images`,
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
    res.status(500).json({
      message: "Failed to fetch products by category",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get products by brandId (with pagination, search, and metaDetails)
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

    // ── Search support – fully case-insensitive ─────────────────────────
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
                sequelize.fn(
                  "LOWER",
                  sequelize.col("keywords.categories.name"),
                ),
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
    res.status(500).json({
      message: "Failed to fetch products by brand",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
          },
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
        `product ID ${product.id} meta`,
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
        `product ID ${raw.id} meta`,
      );
      const images = parseJsonSafely(
        raw.images,
        [],
        `product ID ${raw.id} images`,
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
    return res.status(500).json({
      message: "Failed to fetch products by IDs",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// GET /api/products/count
exports.getProductCount = async (req, res) => {
  try {
    const count = await Product.count();

    res.json({
      success: true,
      totalProducts: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product count",
    });
  }
};
