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

// === MAIN LOOP ===
for (const r of replacements) {
  if (!r.REMOVE) continue;

  const removeCode = String(r.REMOVE).trim();
  const replaceCode = r.REPLACE ? String(r.REPLACE).trim() : null;
  const mrp = r.MRP ? Number(r.MRP) : null;

  const matchingProducts = products.filter(
    (p) => p.meta && String(p.meta[CODE_KEY]) === removeCode
  );

  if (matchingProducts.length === 0) {
    logs.push(`⚠️ No product found with code ${removeCode}`);
    continue;
  }

  if (replaceCode) {
    // UPDATE operation
    for (const product of matchingProducts) {
      const oldCode = product.meta[CODE_KEY];
      product.meta[CODE_KEY] = replaceCode;

      if (mrp) {
        product.meta[PRICE_KEY] = mrp;
      }

      updatedProducts.push(product);
      logs.push(
        `✅ Updated ${
          product.name || "(Unnamed)"
        }: CODE ${oldCode} → ${replaceCode}${mrp ? `, MRP → ${mrp}` : ""}`
      );
    }
  } else {
    // DELETE operation
    for (const product of matchingProducts) {
      deletedProducts.push(product);
      logs.push(
        `🗑️ Marked for deletion: ${product.name || "(Unnamed)"} [${removeCode}]`
      );
    }
  }
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
