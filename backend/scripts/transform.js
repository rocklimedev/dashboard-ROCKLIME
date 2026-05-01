const fs = require("fs-extra");
const stringSimilarity = require("string-similarity");
const { v4: uuidv4 } = require("uuid");

// FILE PATHS
const UPDATED_FILE = "./scripts/json-outputs/all_sheets_data.json";
const BACKUP_FILE =
  "./scripts/backup/products_backup_acbe7061-9b76-47d1-a509-e4b1f982a36f_2026-04-29T07-47-57-359Z.json";

// OUTPUT
const MERGED_FILE = "./scripts/merged-products.json";
const NEW_FILE = "./scripts/new-products.json";
const LOG_FILE = "./scripts/unmatched-log.txt";

// CONFIG
const MATCH_THRESHOLD = 0.75;
const LOG_EVERY = 100; // progress log interval
const DEBUG = false; // set true for deep logs

// NORMALIZE NAME
function normalize(str) {
  return str
    ?.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

console.time("⏱️ Total Execution Time");

// LOAD FILES
console.log("📂 Loading files...");
const updatedProducts = fs.readJsonSync(UPDATED_FILE);
const backupProducts = fs.readJsonSync(BACKUP_FILE);

console.log(`📊 Updated Products: ${updatedProducts.length}`);
console.log(`📊 Backup Products: ${backupProducts.length}`);

// PREPARE BACKUP NAME LIST
console.log("⚙️ Preparing index...");
const backupNames = backupProducts.map((p) => normalize(p.name));

const mergedProducts = [];
const newProducts = [];
const logs = [];

let matchCount = 0;
let newCount = 0;

updatedProducts.forEach((updated, index) => {
  const start = Date.now();

  const updatedName = normalize(updated.name);

  const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(
    updatedName,
    backupNames,
  );

  const timeTaken = Date.now() - start;

  // ⏳ Slow operation warning
  if (timeTaken > 50) {
    console.log(`🐢 Slow match (${timeTaken}ms): "${updated.name}"`);
  }

  if (bestMatch.rating >= MATCH_THRESHOLD) {
    const existing = backupProducts[bestMatchIndex];

    const merged = {
      ...existing,
      name: updated.name,
      product_code: updated.company_code || existing.product_code,
      description: updated.name,
      meta: {
        ...existing.meta,
        item_code: updated.item_code,
        hsn_code: updated.hsn_code,
      },
      updatedAt: new Date().toISOString(),
    };

    mergedProducts.push(merged);
    matchCount++;

    if (DEBUG) {
      console.log(
        `✅ MATCH (${bestMatch.rating.toFixed(2)}): "${updated.name}" → "${existing.name}"`,
      );
    }
  } else {
    const newProduct = {
      productId: uuidv4(),
      name: updated.name,
      product_code: updated.company_code || "",
      quantity: 0,
      masterProductId: null,
      isMaster: false,
      variantOptions: null,
      variantKey: null,
      skuSuffix: null,
      discountType: null,
      alert_quantity: 1,
      tax: "0.00",
      description: updated.name,
      images: "[]",
      isFeatured: false,
      status: "active",
      brandId: null,
      categoryId: null,
      vendorId: null,
      brand_parentcategoriesId: null,
      meta: {
        item_code: updated.item_code,
        hsn_code: updated.hsn_code,
        units: updated.units,
        category: updated.category,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    newProducts.push(newProduct);
    newCount++;

    logs.push(`No match for: ${updated.name}`);

    if (DEBUG) {
      console.log(`❌ NO MATCH: "${updated.name}"`);
    }
  }

  // 📊 Progress log
  if ((index + 1) % LOG_EVERY === 0) {
    console.log(
      `📈 Processed: ${index + 1}/${updatedProducts.length} | Matches: ${matchCount} | New: ${newCount}`,
    );
  }
});

// SAVE FILES
console.log("💾 Writing output files...");
fs.writeJsonSync(MERGED_FILE, mergedProducts, { spaces: 2 });
fs.writeJsonSync(NEW_FILE, newProducts, { spaces: 2 });
fs.writeFileSync(LOG_FILE, logs.join("\n"));

// FINAL SUMMARY
console.log("✅ Done!");
console.log("📊 Summary:");
console.log(`   ✔ Matches: ${matchCount}`);
console.log(`   ➕ New: ${newCount}`);
console.log(`   ⚠ Logs: ${logs.length}`);

console.timeEnd("⏱️ Total Execution Time");
