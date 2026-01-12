// update-prices-safe-v2.js
const fs = require("fs");
const path = require("path");

// ── CONFIG ───────────────────────────────────────────────────────────────
const PRICING_FILE = path.join(
  __dirname,
  "./json-outputs/all_sheets_data.json"
);
const PRODUCTS_FILE = path.join(
  __dirname,
  "../seeder/backup/products_backup_2026-01-12T05-17-17-875Z.json"
);
const OUTPUT_FILE = path.join(__dirname, "products-updated.json");
const CHANGES_LOG = path.join(__dirname, "price-changes-log.json");

const TARGET_BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";
const COMPANY_CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const SELLING_PRICE_KEY = "9ba862ef-f993-4873-95ef-1fef10036aa5";

// ── LOAD DATA ────────────────────────────────────────────────────────────
const pricingRaw = JSON.parse(fs.readFileSync(PRICING_FILE, "utf-8"));
const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));

// Create lookup map: company_code → new price (as string)
const priceMap = new Map();

pricingRaw.forEach((item) => {
  if (!item.company_code || item.selling_price == null) return;

  const code = String(item.company_code).trim();
  let price = item.selling_price;

  if (typeof price === "number") {
    price = String(price);
  } else {
    price = String(price).trim();
  }

  if (
    price === "" ||
    price === "#VALUE!" ||
    price === "null" ||
    isNaN(Number(price))
  ) {
    return;
  }

  priceMap.set(code, price);
});

console.log(`Loaded ${priceMap.size} valid price entries from cleaned data`);

// ── PROCESS PRODUCTS ─────────────────────────────────────────────────────
const changes = [];
let updatedCount = 0;
let skippedCount = 0;
let unchangedCount = 0;

const updatedProducts = products.map((product) => {
  if (
    product.brandId !== TARGET_BRAND_ID ||
    !product.meta ||
    typeof product.meta !== "object" ||
    !(COMPANY_CODE_KEY in product.meta) ||
    !product.meta[COMPANY_CODE_KEY]
  ) {
    skippedCount++;
    return product;
  }

  const companyCode = String(product.meta[COMPANY_CODE_KEY]).trim();
  const newPrice = priceMap.get(companyCode);

  if (newPrice === undefined) {
    skippedCount++;
    return product;
  }

  let currentPrice = product.meta[SELLING_PRICE_KEY];
  currentPrice = currentPrice == null ? null : String(currentPrice).trim();

  if (currentPrice === newPrice) {
    unchangedCount++;
    return product;
  }

  // Real change
  updatedCount++;

  changes.push({
    productId: product.productId || "(missing)",
    name: product.name || "(name missing)",
    companyCode,
    oldPrice: currentPrice ?? "(missing)",
    newPrice,
    changedAt: new Date().toISOString(),
  });

  return {
    ...product,
    meta: {
      ...product.meta,
      [SELLING_PRICE_KEY]: newPrice,
    },
    updatedAt: new Date().toISOString(),
  };
});

// ── SUMMARY & OUTPUT ─────────────────────────────────────────────────────
console.log("\nSUMMARY:");
console.log(`Total products processed     : ${products.length}`);
console.log(`Skipped (other brands / no company_code) : ${skippedCount}`);
console.log(`Prices already correct       : ${unchangedCount}`);
console.log(`Actually updated             : ${updatedCount}`);

if (changes.length > 0) {
  console.log("\nSample of changes (first 6):");
  console.table(changes.slice(0, 6));
  if (changes.length > 6) console.log(`... and ${changes.length - 6} more`);
} else {
  console.log("\nNo price changes were detected.");
}

// Filter only the products that actually received a price update
const onlyUpdatedProducts = updatedProducts.filter((product) => {
  const productId = product.productId || "(missing)";
  return changes.some((change) => change.productId === productId);
});

if (onlyUpdatedProducts.length > 0) {
  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(onlyUpdatedProducts, null, 2),
    "utf-8"
  );
  console.log(
    `\nSaved ONLY the ${onlyUpdatedProducts.length} updated products → ${OUTPUT_FILE}`
  );
} else {
  console.log("\nNo products were updated → output file not created.");
}

fs.writeFileSync(CHANGES_LOG, JSON.stringify(changes, null, 2), "utf-8");
console.log(`→ Detailed change log → ${CHANGES_LOG}`);
