// filter_by_brand.js
const fs = require("fs");

// ============================= CONFIG =============================
const PRODUCTS_FILE = "./seeder/backup/products_backup.json";
const OUTPUT_FILE = "./filtered_products.json";
const TARGET_BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";

// ============================= LOAD DATA =============================
const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));

// ============================= FILTER =============================
const filtered = products.filter((p) => {
  const brandId = p.brandId || (p.meta && p.meta.brandId);
  return brandId === TARGET_BRAND_ID;
});

// ============================= WRITE OUTPUT =============================
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filtered, null, 2));

console.log(
  `Filtered ${filtered.length} products for brandId = ${TARGET_BRAND_ID}`
);
console.log(`Output written → ${OUTPUT_FILE}`);
