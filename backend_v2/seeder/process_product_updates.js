const fs = require("fs");
const path = require("path");

// === CONFIG ===
const backupFile = "E:/dashboard/backend/seeder/backup/products_backup.json";
const replacementsFile =
  "E:/dashboard/backend/seeder/backup/product_replacements.json";

const outputFolder = path.join(__dirname, "./seeder/update-outputs");

if (!fs.existsSync(backupFile) || !fs.existsSync(replacementsFile)) {
  console.error("❌ Missing one or both input files. Exiting.");
  process.exit(1);
}

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// === READ FILES ===
const products = JSON.parse(fs.readFileSync(backupFile, "utf-8"));
const replacements = JSON.parse(fs.readFileSync(replacementsFile, "utf-8"));

const updatedProducts = [];
const deletedProducts = [];
const logs = [];

const PRICE_KEY = "9ba862ef-f993-4873-95ef-1fef10036aa5";
const CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";

console.log(`Loaded ${products.length} products from backup`);
console.log(`Loaded ${replacements.length} replacement rules`);

// === NORMALIZER ===
const normalize = (v) =>
  v === null || v === undefined
    ? ""
    : String(v)
        .trim()
        .replace(/^"+|"+$/g, "");

// === MAIN LOOP ===
for (const r of replacements) {
  const removeCode = r.REMOVE ? normalize(r.REMOVE) : null;
  const replaceCode = r.REPLACE ? normalize(r.REPLACE) : null;
  const mrp = r.MRP ? Number(r.MRP) : null;

  // Case 1: Only REMOVE → delete
  if (removeCode && !replaceCode) {
    const matching = products.filter(
      (p) => p.meta && normalize(p.meta[CODE_KEY]) === removeCode
    );
    for (const product of matching) {
      deletedProducts.push(product);
      logs.push(`Deleted: ${product.name || "(Unnamed)"} [${removeCode}]`);
    }
    if (matching.length === 0)
      logs.push(`No product found to delete with code ${removeCode}`);
    continue;
  }

  // Case 2: Both REMOVE and REPLACE → update code (and MRP if given)
  if (removeCode && replaceCode) {
    const matching = products.filter(
      (p) => p.meta && normalize(p.meta[CODE_KEY]) === removeCode
    );
    for (const product of matching) {
      const oldCode = product.meta[CODE_KEY];
      product.meta[CODE_KEY] = replaceCode;
      if (mrp !== null) product.meta[PRICE_KEY] = mrp;
      updatedProducts.push(product);
      logs.push(
        `Updated: ${
          product.name || "(Unnamed)"
        } CODE ${oldCode} → ${replaceCode}${
          mrp !== null ? `, MRP → ${mrp}` : ""
        }`
      );
    }
    if (matching.length === 0)
      logs.push(`No product found with code ${removeCode} to update`);
    continue;
  }

  // Case 3: Only REPLACE (no REMOVE) → Warning or special handling?
  if (!removeCode && replaceCode) {
    logs.push(
      `Invalid rule S.NO ${r["S.NO"]}: REPLACE provided without REMOVE → skipped`
    );
    continue;
  }

  // Case 4: Nothing → skip
  logs.push(`Invalid rule S.NO ${r["S.NO"]}: no REMOVE or REPLACE → skipped`);
}
// === WRITE OUTPUTS ===
const updatedFile = path.join(outputFolder, "updated_products.json");
const deletedFile = path.join(outputFolder, "deleted_products.json");
const logFile = path.join(outputFolder, "update_log.txt");

fs.writeFileSync(
  updatedFile,
  JSON.stringify(updatedProducts, null, 2),
  "utf-8"
);
fs.writeFileSync(
  deletedFile,
  JSON.stringify(deletedProducts, null, 2),
  "utf-8"
);
fs.writeFileSync(logFile, logs.join("\n"), "utf-8");

console.log(`✅ Updated products: ${updatedProducts.length}`);
console.log(`🗑️ Products to delete: ${deletedProducts.length}`);
console.log(`📝 Logs written to ${logFile}`);
console.log("✅ Processing complete.");
