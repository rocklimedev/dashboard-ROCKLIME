const fs = require("fs");

// ---------------------------
// CONFIGURE UUIDs HERE
// ---------------------------
const uuidList = [
  "b9e1df45-113d-11f1-b773-52540021303b",
  "9ba862ef-f993-4873-95ef-1fef10036aa5",
  "d11da9f9-3f2e-4536-8236-9671200cca4a",
  "4a427124-1143-11f1-b773-52540021303b",
  "4a408954-1143-11f1-b773-52540021303b",
];

// ---------------------------
// LOAD INPUT JSON FILE
// ---------------------------
const inputFile = "./seeders/normalized_products.json";
const outputFile = "output.json";

let products;

try {
  const raw = fs.readFileSync(inputFile, "utf8");
  products = JSON.parse(raw);
} catch (err) {
  console.error("❌ Failed to read input.json:", err);
  process.exit(1);
}

// ---------------------------
// NORMALIZE FUNCTION
// ---------------------------
function normalizeProducts(products, uuidList) {
  return products.map((product) => {
    if (!product.meta || typeof product.meta !== "object") {
      product.meta = {};
    }

    uuidList.forEach((uuid) => {
      // Move top-level UUID → meta
      if (product.hasOwnProperty(uuid)) {
        product.meta[uuid] = product[uuid];
        delete product[uuid];
      }
      // Ensure it exists in meta
      else if (!product.meta.hasOwnProperty(uuid)) {
        product.meta[uuid] = null;
      }
    });

    return product;
  });
}

// ---------------------------
// RUN NORMALIZATION
// ---------------------------
const normalized = normalizeProducts(products, uuidList);

// ---------------------------
// SAVE TO output.json
// ---------------------------
try {
  fs.writeFileSync(outputFile, JSON.stringify(normalized, null, 2), "utf8");
  console.log("✅ Normalized data saved to", outputFile);
} catch (err) {
  console.error("❌ Failed to write output.json:", err);
}
