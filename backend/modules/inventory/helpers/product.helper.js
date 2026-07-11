const { Op } = require("sequelize");
const { Keyword, Category, ProductMeta, Product } = require("../../models");

// UUID of the "Company Code" custom meta field — referenced across search/query services
const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a";

/**
 * Forces the Product <-> Keyword (M:N) and Keyword -> Category associations
 * to exist. Several endpoints call this defensively before querying because
 * associations can be lost across some deploy targets (e.g. Render) if the
 * models are re-required in a different order.
 */
function ensureAssociations() {
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

  if (!Keyword.associations.categories) {
    Keyword.belongsTo(Category, {
      foreignKey: "categoryId",
      as: "categories",
    });
  }
}

/**
 * Safely parse JSON with a fallback value + logging on failure.
 * Accepts values that are already objects/arrays (pass-through).
 */
function parseJsonSafely(input, fallback = {}, context = "") {
  if (input == null) return fallback;
  if (typeof input !== "string") return input; // already object/array

  const trimmed = input.trim();
  if (trimmed === "" || trimmed === "null") return fallback;

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    console.warn(
      `Invalid JSON detected in ${context}:`,
      trimmed.substring(0, 200),
    );
    return fallback;
  }
}

/** Normalizes a raw `keywords` association array into the API shape used everywhere. */
function enrichKeywords(rawKeywords = []) {
  return (rawKeywords || []).map((k) => ({
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
}

/** Collects every distinct meta-field UUID used across a list of raw products. */
function collectMetaIds(products) {
  const metaIds = new Set();
  products.forEach((p) => {
    const meta = parseJsonSafely(p.meta, {});
    if (meta && typeof meta === "object") {
      Object.keys(meta).forEach((id) => metaIds.add(id));
    }
  });
  return metaIds;
}

/** Fetches ProductMeta definitions for a set of ids and returns a lookup map keyed by id. */
async function buildMetaMap(metaIds) {
  if (!metaIds || metaIds.size === 0) return {};
  const metaDefs = await ProductMeta.findAll({
    where: { id: { [Op.in]: Array.from(metaIds) } },
    attributes: ["id", "title", "slug", "fieldType", "unit"],
  });
  return Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));
}

/** Turns a raw `meta` object + a metaMap (from buildMetaMap) into the `metaDetails` array shape. */
function buildMetaDetails(metaObj, metaMap) {
  return Object.entries(metaObj || {}).map(([id, value]) => {
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
}

/** Standard nested include for keywords -> category, reused by every list/search endpoint. */
const KEYWORD_INCLUDE = {
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
};

/**
 * Full enrichment pipeline for a single product instance (used by variant/detail
 * endpoints that need the same shape as the list endpoints but for one record).
 */
async function enrichProduct(productInstance) {
  const raw = productInstance.toJSON
    ? productInstance.toJSON()
    : productInstance;
  const metaObj = parseJsonSafely(raw.meta, {}, `product ${raw.productId}`);
  const images = parseJsonSafely(
    raw.images,
    [],
    `product ${raw.productId} images`,
  );
  const metaMap = await buildMetaMap(new Set(Object.keys(metaObj)));

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
    masterProductId: raw.masterProductId || raw.productId,
  };
}

module.exports = {
  COMPANY_CODE_META_ID,
  ensureAssociations,
  parseJsonSafely,
  enrichKeywords,
  collectMetaIds,
  buildMetaMap,
  buildMetaDetails,
  KEYWORD_INCLUDE,
  enrichProduct,
};
