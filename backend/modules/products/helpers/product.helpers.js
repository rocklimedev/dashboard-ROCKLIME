const { Op } = require("sequelize");
const sequelize = require("../../../config/database");
const {
  Product,
  ProductMeta,
  Brand,
  Keyword,
  Category,
} = require("../../../models");

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
      trimmed.substring(0, 200),
    );
    return fallback;
  }
};

const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a"; // ← your existing UUID

async function generateProductCode({
  brandId,
  categoryId, // optional – can be ignored if not needed in code
  companyCode, // ← this is the 4-digit base from frontend (Company/Batch Code)
  transaction,
}) {
  // ────────────────────────────────────────────────
  // Brand short code & prefix part
  // ────────────────────────────────────────────────
  let brandShort = "XX"; // fallback
  let brandPrefix = "XX";

  if (brandId) {
    const brand = await Brand.findByPk(brandId, {
      attributes: ["brandName"],
      transaction,
    });
    if (brand?.brandName) {
      const name = brand.brandName.trim().toUpperCase();
      brandShort = name.slice(0, 2); // e.g. "PR", "GR", "PE"
      brandPrefix = name.slice(0, 2); // same or customize if needed
    }
  }

  // ────────────────────────────────────────────────
  // Base code = Company/Batch Code from frontend (4 digits)
  // ────────────────────────────────────────────────
  let baseCode = "0000";

  if (companyCode) {
    const raw = String(companyCode).trim();
    const digits = raw.replace(/\D/g, ""); // keep only numbers
    if (digits.length >= 4) {
      baseCode = digits.slice(-4); // take last 4 digits
    } else if (digits.length > 0) {
      baseCode = digits.padEnd(4, "0"); // pad if shorter
    }
  } else {
    // Ultimate fallback if user didn't enter anything
    baseCode = new Date().getFullYear().toString().slice(-2) + "00";
  }

  // ────────────────────────────────────────────────
  // Final prefix: E + BrandShort + BrandPrefix + baseCode
  // Example: EPRPE3009XXXX
  // ────────────────────────────────────────────────
  const prefix = `E${brandShort}${brandPrefix}${baseCode}`;

  // ────────────────────────────────────────────────
  // Generate random 4-digit suffix (1000–9999) + retry if duplicate
  // ────────────────────────────────────────────────
  let newCode;
  let attempts = 0;
  const MAX_ATTEMPTS = 50; // very safe – collisions are rare

  do {
    if (attempts++ > MAX_ATTEMPTS) {
      throw new Error(
        `Cannot generate unique product code after ${MAX_ATTEMPTS} attempts`,
      );
    }

    const suffix = Math.floor(1000 + Math.random() * 9000).toString(); // 1000–9999
    newCode = `${prefix}${suffix}`;

    const exists = await Product.findOne({
      where: { product_code: newCode },
      transaction,
    });

    if (!exists) break;
  } while (true);

  return newCode;
}

/**
 * Shared keyword include for Product queries
 */
const getKeywordInclude = () => ({
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
});

/**
 * Normalize keywords array from a product instance / toJSON()
 */
const normalizeKeywords = (rawKeywords = []) =>
  (rawKeywords || []).map((k) => ({
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

/**
 * Build metaDetails from a meta object + metaMap of definitions
 */
const buildMetaDetails = (metaObj, metaMap) =>
  Object.entries(metaObj || {}).map(([id, value]) => {
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

/**
 * Collect unique meta IDs from a list of products and fetch their definitions
 */
async function fetchMetaMapForProducts(products) {
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

  return Object.fromEntries(metaDefs.map((m) => [m.id, m.toJSON()]));
}

/**
 * Enrich a single product (or array) with images, meta, metaDetails, keywords, flags
 * Accepts either a Sequelize instance or plain object.
 */
async function enrichProducts(products, options = {}) {
  const list = Array.isArray(products) ? products : [products];
  const metaMap = options.metaMap || (await fetchMetaMapForProducts(list));

  const enriched = list.map((product) => {
    const raw = product.toJSON ? product.toJSON() : product;
    const metaObj = parseJsonSafely(raw.meta, {});
    const images = parseJsonSafely(raw.images, []);

    const metaDetails = buildMetaDetails(metaObj, metaMap);
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
      masterProductId: raw.masterProductId || raw.productId || raw.id,
      quantity: Number(raw.quantity) || 0,
    };
  });

  return Array.isArray(products) ? enriched : enriched[0];
}

/**
 * Clean keywordIds input (array or comma-separated string)
 */
const cleanKeywordIds = (keywordIds = []) => {
  if (Array.isArray(keywordIds)) {
    return keywordIds.filter(Boolean);
  }
  if (typeof keywordIds === "string") {
    return keywordIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return [];
};

module.exports = {
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
};
