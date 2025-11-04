const fs = require("fs");

// Load data
const mapping = JSON.parse(
  fs.readFileSync("./seeder/replacements.json", "utf8")
);
const products = JSON.parse(
  fs.readFileSync("./seeder/backup/products_backup.json", "utf8")
);

// Define keys for clarity
const COMPANY_CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const SELLING_PRICE_KEY = "9ba862ef-f993-4873-95ef-1fef10036aa5";

let removedCount = 0;
let replacedCount = 0;
let updatedMRPCount = 0;
let updateLog = [];

// Output arrays
let updateRecords = [];
let removeRecords = [];
let notFoundRecords = [];

for (const mapItem of mapping) {
  const { REMOVE, REPLACE, MRP } = mapItem;

  if (!REMOVE) continue; // skip empty rows

  // Find product by REMOVE company code
  const targetIndex = products.findIndex(
    (p) => p.meta && p.meta[COMPANY_CODE_KEY] == REMOVE
  );

  // If REMOVE company code not found, log and skip
  if (targetIndex === -1) {
    notFoundRecords.push({
      REMOVE,
      REPLACE: REPLACE || null,
      note: "REMOVE company code not found in products.json",
    });
    continue;
  }

  const product = products[targetIndex];

  // Case 1: REMOVE but no REPLACE → remove product
  if (REMOVE && !REPLACE) {
    removeRecords.push(product);
    products.splice(targetIndex, 1);
    removedCount++;
    continue;
  }

  // Case 2: REMOVE and REPLACE → update company code
  if (REMOVE && REPLACE) {
    const exists = products.find(
      (p) => p.meta && p.meta[COMPANY_CODE_KEY] == REPLACE
    );

    if (exists) {
      updateLog.push(
        `Duplicate company code found: ${REPLACE} (original: ${REMOVE}, product: ${product.name})`
      );
    } else {
      product.meta[COMPANY_CODE_KEY] = REPLACE;
      replacedCount++;
      updateRecords.push(product);
    }
  }

  // Case 3: MRP update
  if (MRP && product.meta) {
    product.meta[SELLING_PRICE_KEY] = String(MRP);
    updatedMRPCount++;
    if (!updateRecords.includes(product)) updateRecords.push(product);
  }
}

// Write updated product list
fs.writeFileSync("./updated_products.json", JSON.stringify(products, null, 2));

// Write removed records
if (removeRecords.length > 0) {
  fs.writeFileSync("./remove.json", JSON.stringify(removeRecords, null, 2));
}

// Write updated/replaced records
if (updateRecords.length > 0) {
  fs.writeFileSync("./update.json", JSON.stringify(updateRecords, null, 2));
}

// Write not found records (for auditing)
if (notFoundRecords.length > 0) {
  fs.writeFileSync(
    "./not_found.json",
    JSON.stringify(notFoundRecords, null, 2)
  );
}

// Write duplicate log if any
if (updateLog.length > 0) {
  fs.writeFileSync("./update.txt", updateLog.join("\n"));
}

console.log("=== Operation Complete ===");
console.log(`Removed products: ${removedCount}`);
console.log(`Replaced company codes: ${replacedCount}`);
console.log(`Updated MRP: ${updatedMRPCount}`);
console.log(`update.json → ${updateRecords.length} records`);
console.log(`remove.json → ${removeRecords.length} records`);
console.log(`not_found.json → ${notFoundRecords.length} missing entries`);
console.log(`Update log saved (${updateLog.length} duplicates)`);
