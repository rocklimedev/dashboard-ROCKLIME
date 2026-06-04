const fs = require("fs");
const path = require("path");

const COMPANY_CODE_FIELD = "d11da9f9-3f2e-4536-8236-9671200cca4a";

const NORMALIZED_FILE = "./scripts/json-outputs/all_sheets_data1.json";
const BACKUP_FILE =
  "./scripts/backup/grohe_products_backup_2026-06-03T05-31-19-010Z.json";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

const normalizedProducts = readJson(NORMALIZED_FILE);
const backupProducts = readJson(BACKUP_FILE);

console.log(`Loaded ${normalizedProducts.length} normalized products`);
console.log(`Loaded ${backupProducts.length} backup products`);

const backupLookup = new Map();

for (const product of backupProducts) {
  const companyCode = product?.meta?.[COMPANY_CODE_FIELD];

  if (companyCode !== undefined && companyCode !== null) {
    backupLookup.set(String(companyCode), product);
  }
}

const updatedProducts = [];
const newProducts = [];
const unmatchedCodes = [];

for (const incoming of normalizedProducts) {
  const companyCode = incoming[COMPANY_CODE_FIELD];

  if (companyCode === undefined || companyCode === null) {
    console.warn("Skipping product with missing company code:", incoming.name);
    continue;
  }

  const existing = backupLookup.get(String(companyCode));

  if (existing) {
    // -------------------------
    // UPDATE EXISTING PRODUCT
    // -------------------------

    if (incoming.name) {
      existing.name = incoming.name;
    }

    if (incoming.description) {
      existing.description = incoming.description;
    }

    if (incoming.tax !== undefined) {
      const taxValue = Number(incoming.tax);

      existing.tax = Number.isNaN(taxValue)
        ? existing.tax
        : (taxValue * 100).toFixed(2);
    }

    existing.meta = {
      ...(existing.meta || {}),
    };

    for (const [key, value] of Object.entries(incoming)) {
      if (key === "name" || key === "description" || key === "tax") {
        continue;
      }

      existing.meta[key] = value;
    }

    updatedProducts.push(existing);
  } else {
    // -------------------------
    // NEW PRODUCT
    // KEEP FORMAT UNCHANGED
    // -------------------------

    newProducts.push(incoming);
    unmatchedCodes.push(companyCode);
  }
}

writeJson("./updatedProducts.json", updatedProducts);

writeJson("./newProducts.json", newProducts);

writeJson("./unmatchedCodes.json", unmatchedCodes);

console.log("\n========== SUMMARY ==========");
console.log(`Updated Products : ${updatedProducts.length}`);

console.log(`New Products     : ${newProducts.length}`);

console.log(`Unmatched Codes  : ${unmatchedCodes.length}`);

console.log("\nFiles generated:");
console.log("✓ updatedProducts.json");
console.log("✓ newProducts.json");
console.log("✓ unmatchedCodes.json");
