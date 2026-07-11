const { Brand, Product } = require("../../models");

/**
 * Generates a product code of shape: E{BrandShort}{BrandPrefix}{BaseCode}{RandomSuffix}
 * e.g. EPRPE30099421
 */
async function generateProductCode({
  brandId,
  categoryId,
  companyCode,
  transaction,
}) {
  // ── Brand short code & prefix part ──────────────────────────────
  let brandShort = "XX";
  let brandPrefix = "XX";

  if (brandId) {
    const brand = await Brand.findByPk(brandId, {
      attributes: ["brandName"],
      transaction,
    });
    if (brand?.brandName) {
      const name = brand.brandName.trim().toUpperCase();
      brandShort = name.slice(0, 2);
      brandPrefix = name.slice(0, 2);
    }
  }

  // ── Base code = Company/Batch Code from frontend (4 digits) ────
  let baseCode = "0000";

  if (companyCode) {
    const raw = String(companyCode).trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 4) {
      baseCode = digits.slice(-4);
    } else if (digits.length > 0) {
      baseCode = digits.padEnd(4, "0");
    }
  } else {
    baseCode = new Date().getFullYear().toString().slice(-2) + "00";
  }

  const prefix = `E${brandShort}${brandPrefix}${baseCode}`;

  // ── Random 4-digit suffix (1000–9999) + retry on collision ─────
  let newCode;
  let attempts = 0;
  const MAX_ATTEMPTS = 50;

  do {
    if (attempts++ > MAX_ATTEMPTS) {
      throw new Error(
        `Cannot generate unique product code after ${MAX_ATTEMPTS} attempts`,
      );
    }

    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    newCode = `${prefix}${suffix}`;

    const exists = await Product.findOne({
      where: { product_code: newCode },
      transaction,
    });

    if (!exists) break;
  } while (true);

  return newCode;
}

/** Returns whether a product_code already exists. Throws on invalid input. */
async function checkProductCodeExists(code) {
  if (!code || typeof code !== "string") {
    throw new Error("Code is required");
  }

  const existing = await Product.findOne({
    where: { product_code: code.trim() },
    attributes: ["product_code"],
  });

  return !!existing;
}

module.exports = { generateProductCode, checkProductCodeExists };
