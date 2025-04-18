const fs = require("fs");
const path = require("path");

// Load JSON files
const cleaned = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "./logs/duplicateProductsInJSON.json"),
    "utf-8"
  )
);
const notFound = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./notFoundProductCode.json"), "utf-8")
);

const matched = [];
const notFoundProductCode = [];

// Convert all cleaned "Company Code" into strings for uniformity
const cleanedMap = new Map();
cleaned.forEach((product) => {
  cleanedMap.set(String(product["Company Code"]), product["Product Code"]);
});

// Match products
notFound.forEach((product) => {
  const productCode = cleanedMap.get(String(product.company_code));

  if (productCode) {
    product.productCode = productCode; // Add the Product Code
    matched.push(product);
  } else {
    notFoundProductCode.push(product); // Couldn’t find, move to new list
  }
});

// Save updated notFoundProducts.json (matched)
fs.writeFileSync(
  path.join(__dirname, "./logs/duplicateProductsInJSON.json"),
  JSON.stringify(matched, null, 2)
);

// Save notFoundProductCode.json (unmatched)
fs.writeFileSync(
  path.join(__dirname, "./notFoundProducts.json"),
  JSON.stringify(notFoundProductCode, null, 2)
);

console.log("✅ Seeder run complete!");
console.log(`✔ Matched: ${matched.length}`);
console.log(`✘ Not Found: ${notFoundProductCode.length}`);
