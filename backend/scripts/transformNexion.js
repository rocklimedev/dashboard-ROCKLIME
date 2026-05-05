// smart-normalizer.js

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Input file
 */
const input = require("./nexion.json");

/**
 * Detect product type automatically
 */
function hasColors(product) {
  return Array.isArray(product.colors) && product.colors.length > 0;
}

/**
 * Normalize entire dataset
 */
function normalizeProducts(data) {
  const result = [];

  data.forEach((product) => {
    const { name, category } = product;

    if (hasColors(product)) {
      // TYPE 1: Color-based
      product.colors.forEach((color) => {
        product.variants.forEach((variant) => {
          result.push(buildProduct({ name, category, color, variant }));
        });
      });
    } else {
      // TYPE 2: No colors
      product.variants.forEach((variant) => {
        result.push(buildProduct({ name, category, color: null, variant }));
      });
    }
  });

  return result;
}

/**
 * Build normalized product
 */
function buildProduct({ name, category, color, variant }) {
  const cleanName = name.trim();
  const cleanColor = color ? color.trim() : null;

  // 👇 Add color to name
  const finalName = cleanColor
    ? `${cleanName} - ${cleanColor} - ${variant.size_mm}`
    : `${cleanName} - ${variant.size_mm}`;
  const slug = `${cleanName}-${cleanColor || "NA"}-${variant.size_mm}`
    .toLowerCase()
    .replace(/\s+/g, "-");

  const sku = `${cleanName}-${cleanColor || "NA"}-${variant.size_mm}`
    .toUpperCase()
    .replace(/\s+/g, "");

  return {
    id: crypto.randomUUID(),

    name: finalName, // 👈 updated here
    category,

    colors: cleanColor ? [cleanColor] : [],

    size_mm: variant.size_mm,
    caliber: variant.caliber,

    retail_mrp_per_sft: variant.retail_mrp_per_sft,
    ex_factory_per_sft: variant.ex_factory_per_sft,

    pcs_per_box: variant.pcs_per_box,
    sft_per_box: variant.sft_per_box,
    kg_per_box: variant.kg_per_box,
    mrp_per_box: variant.mrp_per_box,

    sku,
    slug,
  };
}

/**
 * Run normalization
 */
const output = normalizeProducts(input);

/**
 * Output file path
 */
const outputPath = path.join(__dirname, "normalized.json");

/**
 * Write file
 */
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

console.log(`✅ Normalized JSON saved at: ${outputPath}`);
