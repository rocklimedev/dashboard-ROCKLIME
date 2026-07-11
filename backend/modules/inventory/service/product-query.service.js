const { Op } = require("sequelize");
const sequelize = require("../../config/database");
const { Product, ProductMeta } = require("../../models");
const {
  ensureAssociations,
  parseJsonSafely,
  enrichKeywords,
  collectMetaIds,
  buildMetaMap,
  buildMetaDetails,
  KEYWORD_INCLUDE,
  COMPANY_CODE_META_ID,
} = require("./productHelpers");

/**
 * Main paginated product listing used by the inventory screen.
 * Supports free-text search, tab filters (in-stock/out-of-stock/low-stock),
 * and orders by most recently touched inventory first.
 */
async function getAllProducts({
  page = 1,
  limit = 50,
  search,
  tab = "all",
  lowStockThreshold = 10,
}) {
  ensureAssociations();

  const offset = (page - 1) * limit;
  const searchTerm = search?.trim();
  const whereClause = {};

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
            sequelize.literal(`'$."${COMPANY_CODE_META_ID}"'`),
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

  if (tab === "in-stock") {
    whereClause.quantity = { [Op.gt]: 0 };
  } else if (tab === "out-of-stock") {
    whereClause.quantity = 0;
  } else if (tab === "low-stock") {
    whereClause.quantity = { [Op.gt]: 0, [Op.lte]: lowStockThreshold };
  }

  const order = [
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
    [
      sequelize.literal(
        `CASE WHEN \`Product\`.\`quantity\` > 0 THEN 0 ELSE 1 END`,
      ),
      "ASC",
    ],
    ["updatedAt", "DESC"],
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
      include: [KEYWORD_INCLUDE],
    });

  if (totalProducts === 0) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const metaMap = await buildMetaMap(collectMetaIds(products));

  const enrichedProducts = products.map((product) => {
    const raw = product.toJSON();
    const metaObj = parseJsonSafely(raw.meta, {});
    const images = parseJsonSafely(raw.images, []);

    return {
      ...raw,
      images,
      meta: metaObj,
      metaDetails: buildMetaDetails(metaObj, metaMap),
      keywords: enrichKeywords(raw.keywords),
      variantOptions: raw.variantOptions || {},
      variantKey: raw.variantKey || null,
      skuSuffix: raw.skuSuffix || null,
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
      quantity: Number(raw.quantity) || 0,
    };
  });

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

async function getProductsByCategory(
  categoryId,
  { page = 1, limit = 50, search } = {},
) {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  ensureAssociations();

  const where = { categoryId };

  if (search && search.trim()) {
    const pattern = `%${search.trim().toLowerCase()}%`;
    where[Op.or] = [
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
            sequelize.literal(`'$."${COMPANY_CODE_META_ID}"'`),
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
    ];
  }

  const { count: total, rows: products } = await Product.findAndCountAll({
    where,
    offset,
    limit: limitNum,
    order: [["name", "ASC"]],
    include: [KEYWORD_INCLUDE],
    subQuery: false,
  });

  if (total === 0) {
    return {
      data: [],
      pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 },
    };
  }

  const allMetaDefs = await ProductMeta.findAll({
    attributes: ["id", "title", "slug", "fieldType", "unit"],
  });
  const metaMap = Object.fromEntries(
    allMetaDefs.map((m) => [m.toJSON().id, m.toJSON()]),
  );

  const enriched = products.map((p) => {
    const raw = p.toJSON();
    const metaObj = parseJsonSafely(raw.meta, {}, `product ${raw.id}`);
    const images = parseJsonSafely(raw.images, [], `product ${raw.id} images`);

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

    return {
      ...raw,
      images,
      meta: metaObj,
      metaDetails,
      keywords: enrichKeywords(raw.keywords),
      variantOptions: raw.variantOptions || {},
      variantKey: raw.variantKey || null,
      skuSuffix: raw.skuSuffix || null,
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
      masterProductId: raw.masterProductId || raw.id,
    };
  });

  return {
    data: enriched,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

async function getProductsByBrand(
  brandId,
  { page = 1, limit = 50, search } = {},
) {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  ensureAssociations();

  const where = { brandId };

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
                  sequelize.literal(`'$."${COMPANY_CODE_META_ID}"'`),
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
      include: [KEYWORD_INCLUDE],
      subQuery: false,
    });

  if (totalProducts === 0) {
    return {
      data: [],
      pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 },
    };
  }

  const metaDefs = await ProductMeta.findAll({
    attributes: ["id", "title", "slug", "fieldType", "unit"],
  });
  const metaMap = Object.fromEntries(
    metaDefs.map((m) => [m.toJSON().id, m.toJSON()]),
  );

  const enrichedProducts = products.map((product) => {
    const raw = product.toJSON();
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

    return {
      ...raw,
      images,
      meta: metaObj,
      metaDetails,
      keywords: enrichKeywords(raw.keywords),
      variantOptions: raw.variantOptions || {},
      variantKey: raw.variantKey || null,
      skuSuffix: raw.skuSuffix || null,
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
      masterProductId: raw.masterProductId || raw.id || raw.productId,
    };
  });

  return {
    data: enrichedProducts,
    pagination: {
      total: totalProducts,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalProducts / limitNum),
    },
  };
}

async function searchProducts(query) {
  const {
    q,
    query: legacyQuery,
    name,
    sellingPrice,
    minSellingPrice,
    maxSellingPrice,
    companyCode,
    productCode,
    brandId,
    categoryId,
  } = query;

  const searchTerm = (q || legacyQuery || "").trim();
  const filters = {};

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
      sequelize.where(
        sequelize.fn(
          "LOWER",
          sequelize.fn(
            "JSON_EXTRACT",
            sequelize.col("Product.meta"),
            sequelize.literal(`'$."${COMPANY_CODE_META_ID}"'`),
          ),
        ),
        Op.like,
        pattern,
      ),
      { brandId: { [Op.eq]: searchTerm } },
      { categoryId: { [Op.eq]: searchTerm } },
    ];
  }

  if (name) filters.name = { [Op.iLike]: `%${name}%` };
  if (sellingPrice) filters["meta->sellingPrice"] = Number(sellingPrice);
  if (minSellingPrice)
    filters["meta->sellingPrice"] = { [Op.gte]: Number(minSellingPrice) };
  if (maxSellingPrice)
    filters["meta->sellingPrice"] = { [Op.lte]: Number(maxSellingPrice) };
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
    order: [["name", "ASC"]],
    limit: 100,
  });

  if (products.length === 0) return [];

  const metaMap = await buildMetaMap(collectMetaIds(products));

  return products.map((product) => {
    const raw = product.toJSON();
    const metaObj = parseJsonSafely(raw.meta, {}, `product ${raw.productId}`);
    const images = parseJsonSafely(
      raw.images,
      [],
      `product ${raw.productId} images`,
    );

    return {
      ...raw,
      images,
      meta: metaObj,
      metaDetails: buildMetaDetails(metaObj, metaMap),
      variantOptions: raw.variantOptions || {},
      variantKey: raw.variantKey || null,
      skuSuffix: raw.skuSuffix || null,
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
      masterProductId: raw.masterProductId || raw.productId,
    };
  });
}

async function getProductsByIds(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    const err = new Error("productIds must be a non-empty array");
    err.status = 400;
    throw err;
  }

  if (productIds.some((id) => !id || typeof id !== "string")) {
    const err = new Error("All productIds must be non-empty strings");
    err.status = 400;
    throw err;
  }

  ensureAssociations();

  const products = await Product.findAll({
    where: { productId: { [Op.in]: productIds } },
    attributes: { exclude: ["createdAt", "updatedAt"] },
    order: [["name", "ASC"]],
    include: [KEYWORD_INCLUDE],
  });

  const foundProductIds = products.map((p) => p.productId);
  const missingIds = productIds.filter((id) => !foundProductIds.includes(id));

  if (missingIds.length > 0) {
    const err = new Error(
      `Products not found for IDs: ${missingIds.join(", ")}`,
    );
    err.status = 404;
    throw err;
  }

  const metaMap = await buildMetaMap(collectMetaIds(products));

  const enrichedProducts = products.map((product) => {
    const raw = product.toJSON();
    const metaObj = parseJsonSafely(raw.meta, {}, `product ID ${raw.id} meta`);
    const images = parseJsonSafely(
      raw.images,
      [],
      `product ID ${raw.id} images`,
    );

    return {
      ...raw,
      images,
      meta: metaObj,
      metaDetails: buildMetaDetails(metaObj, metaMap),
      keywords: enrichKeywords(raw.keywords),
      variantOptions: raw.variantOptions || {},
      variantKey: raw.variantKey || null,
      skuSuffix: raw.skuSuffix || null,
      isMaster: !!raw.isMaster,
      isVariant: !!raw.masterProductId,
      masterProductId: raw.masterProductId || raw.id,
    };
  });

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

  return { count: products.length, data: enrichedProducts };
}

async function getAllProductCodesBrandWise() {
  const products = await Product.findAll({
    attributes: ["product_code", "brandId"],
    where: { status: "active" },
    raw: true,
  });

  const grouped = products.reduce((acc, p) => {
    const brandId = p.brandId || "unknown";
    if (!acc[brandId]) acc[brandId] = [];
    acc[brandId].push(p.product_code);
    return acc;
  }, {});

  return { count: products.length, data: grouped };
}

async function getProductCount() {
  return Product.count();
}

module.exports = {
  getAllProducts,
  getProductsByCategory,
  getProductsByBrand,
  searchProducts,
  getProductsByIds,
  getAllProductCodes,
  getAllProductCodesBrandWise,
  getProductCount,
};
