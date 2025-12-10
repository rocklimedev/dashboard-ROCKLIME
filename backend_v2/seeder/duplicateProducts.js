const fs = require("fs");
const path = require("path");

const products = require("./backup/products_backup.json");

// KEY WHERE COMPANY CODE IS STORED
const CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";

// Normalize helper
const normalize = (v) =>
  v === null || v === undefined
    ? ""
    : String(v)
        .trim()
        .replace(/^"+|"+$/g, "");

// Function to find duplicates by company code
function findDuplicateCompanyCodes(products) {
  const seen = new Map();
  const duplicates = [];

  for (const product of products) {
    if (!product.meta) continue;

    const code = normalize(product.meta[CODE_KEY]);
    if (!code) continue;

    if (seen.has(code)) {
      // push original only once
      if (!duplicates.find((p) => normalize(p.meta[CODE_KEY]) === code)) {
        duplicates.push(seen.get(code));
      }
      duplicates.push(product);
    } else {
      seen.set(code, product);
    }
  }

  return duplicates;
}

const duplicates = findDuplicateCompanyCodes(products);

console.log(`Found ${duplicates.length} duplicate products sharing code`);

// write to JSON
const outputFile = path.join(__dirname, "duplicate_products.json");

fs.writeFileSync(outputFile, JSON.stringify(duplicates, null, 2), "utf-8");

console.log("Saved:", outputFile);
