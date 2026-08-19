const Cart = require("../models/carts.model");
const { Quotation, User, Product } = require("../../../models");

// ──────────────────────────────────────────────────────
// META SLUGS – these UUIDs are the same for ALL products
// ──────────────────────────────────────────────────────
const META_SLUGS = {
  sellingPrice: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  companyCode: "d11da9f9-3f2e-4536-8236-9671200cca4a",
  barcode: "4ded1cb3-5d31-42e8-90ec-a381a6ab1e35",
  productGroup: "81cd6d76-d7d2-4226-b48e-6704e6224c2b",
};

// ──────────────────────────────────────────────────────
// Reliable & synchronous price extractor
// ──────────────────────────────────────────────────────
const getSellingPrice = (meta) => {
  let parsedMeta = meta;

  // Step 1: If meta is a string → it’s double-encoded → fix it
  if (typeof meta === "string") {
    try {
      parsedMeta = JSON.parse(meta);
    } catch (e) {
      parsedMeta = {};
    }
  }

  // Step 2: If still not an object → give up
  if (!parsedMeta || typeof parsedMeta !== "object") {
    return null;
  }

  // Step 3: Try known price UUID
  const PRICE_UUID = "9ba862ef-f993-4873-95ef-1fef10036aa5";
  let raw = parsedMeta[PRICE_UUID];

  // Step 4: Fallback — scan all values for anything that looks like a price
  if (!raw) {
    for (const value of Object.values(parsedMeta)) {
      if (
        typeof value === "string" &&
        /^\d{2,15}(\.\d{1,4})?$/.test(value.trim())
      ) {
        raw = value;
        break;
      }
      if (typeof value === "number" && value >= 1) {
        return value;
      }
    }
  }

  if (!raw) return null;

  // Step 5: Clean and parse aggressively
  const cleaned = String(raw)
    .replace(/[^\d.]/g, "") // Remove everything except digits and dot
    .replace(/\.(?=.*\.)/g, ""); // Keep only last dot

  const price = parseFloat(cleaned);
  return !isNaN(price) && price >= 1 ? price : null;
};

module.exports = {
  Cart,
  Quotation,
  User,
  Product,
  META_SLUGS,
  getSellingPrice,
};
