// transform-products.js

const fs = require("fs");

// UUID regex (strict enough)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Transform a single product
 */
function transformProduct(product) {
  const meta = {};
  const cleaned = {};

  Object.keys(product).forEach((key) => {
    const value = product[key];

    if (UUID_REGEX.test(key)) {
      // Move UUID fields into meta
      meta[key] = value;
    } else {
      cleaned[key] = value;
    }
  });

  // Attach meta
  cleaned.meta = meta;

  return cleaned;
}

/**
 * Transform array
 */
function transformProducts(data) {
  return data.map(transformProduct);
}

// === USAGE ===

// Load input JSON
const input = require("./normalized.json");

// Transform
const output = transformProducts(input);

// Save output
fs.writeFileSync("./output.json", JSON.stringify(output, null, 2), "utf-8");

console.log("✅ Transformation complete");
