const { Op } = require("sequelize");
const sequelize = require("../../../config/database");
const slugify = require("slugify"); // npm install slugify — highly recommended
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
} = require("../../../models");
// ─────────────────────────────────────────────────────────────────────────────
// Create a product with meta data

// Correct import
const { uploadToFtp } = require("../../../middleware/upload"); // ← this is where it really is
// controllers/productController.js
const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a"; // ← your existing UUID
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

module.exports = {
  Op,
  sequelize,
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
  uploadToFtp,
  COMPANY_CODE_META_ID,
  ensureAssociations,
  parseJsonSafely,
  generateProductCode,
};
