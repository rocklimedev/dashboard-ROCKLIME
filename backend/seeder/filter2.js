// update_images.js
const fs = require("fs");
const path = require("path");

// ============================= CONFIG =============================
const PRODUCTS_FILE = "./seeder/filteredProducts.json";
const IMAGES_DIR = "./seeder/images";
const OUTPUT_FILE = "./updated.json";
const UNUSED_IMAGES_FILE = "./unused_images3.txt";
const UNMATCHED_PRODUCTS_FILE = "./unmatched_products.json";
const MATCHED_BUT_SPEC_FILE = "./matched_but_spec.txt";
const COMPANY_CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const BASE_URL = "https://static.cmtradingco.com/product_images/";

// ONLY PROCESS THIS BRAND
const TARGET_BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";

// ============================= HELPERS =============================
function normalize(str) {
  return String(str || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function isEmptyImageField(img) {
  if (!img) return true;
  if (Array.isArray(img)) return img.length === 0;
  if (typeof img === "string") {
    const trimmed = img.trim();
    return trimmed === "" || trimmed === "[]" || trimmed === "{}";
  }
  return false;
}

// ============================= LOAD DATA =============================
const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
const imageFiles = fs.readdirSync(IMAGES_DIR).filter((f) => !f.startsWith("."));

console.log(`Found ${imageFiles.length} image files.`);

// ============================= BUILD IMAGE INDEX =============================
const imageIndex = new Map();

function indexImage(file) {
  const basename = path.parse(file).name;
  const lower = basename.toLowerCase();

  const tokens = lower
    .split(/[^\w-]+/)
    .filter(Boolean)
    .map(normalize);
  tokens.forEach((t) => addToIndex(t, file));

  addToIndex(normalize(basename), file);
}
function addToIndex(tok, file) {
  if (!tok) return;
  const list = imageIndex.get(tok) || [];
  list.push(file);
  imageIndex.set(tok, list);
}
imageFiles.forEach(indexImage);

// ============================= MAIN LOOP =============================
const updatedProducts = [];
const usedImages = new Set();
const unmatchedProducts = [];
const matchedButSpec = [];

/**
 * Strict match = normalized product name == image name (ignoring case and spacing)
 * OR every token of product name appears in image name
 */
function isStrongNameMatch(productName, imageName) {
  const pn = normalize(productName).replace(/[^a-z0-9]+/g, "");
  const iname = normalize(imageName).replace(/[^a-z0-9]+/g, "");
  if (pn === iname) return true;

  const tokens = normalize(productName)
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const inameFull = normalize(imageName);
  return tokens.every((t) => inameFull.includes(t));
}

for (const product of products) {
  const brandId = product.brandId || (product.meta && product.meta.brandId);
  if (brandId !== TARGET_BRAND_ID) continue;

  const meta = product.meta || {};
  const rawCode = meta[COMPANY_CODE_KEY];
  const code = rawCode ? normalize(String(rawCode)) : null;
  const name = normalize(product.name || product.title || "");

  // Skip products that already have images
  if (!isEmptyImageField(product.images)) continue;

  let matchedFile = null;

  // COMPANY CODE MATCH
  if (code) {
    matchedFile = imageFiles.find((f) =>
      path.parse(f).name.toLowerCase().includes(code)
    );
  }

  // IF NO CODE OR NOT FOUND — strong name match
  if (!matchedFile && name) {
    for (const f of imageFiles) {
      const fname = path.parse(f).name.toLowerCase();
      if (isStrongNameMatch(name, fname)) {
        matchedFile = f;
        break;
      }
    }
  }

  // RECORD
  if (matchedFile) {
    const newImageURL = `${BASE_URL}${matchedFile}`;
    product.images = JSON.stringify([newImageURL]);
    product.updatedAt = new Date().toISOString();
    updatedProducts.push(product);
    usedImages.add(matchedFile);
  } else {
    // Still might be a "possible" — fuzzy partial match
    const closeMatch = imageFiles.find((f) => {
      const fname = path.parse(f).name.toLowerCase();
      return name && fname.includes(name.split(" ")[0]);
    });
    if (closeMatch) {
      matchedButSpec.push({
        id: product.id,
        name: product.name,
        productCode: rawCode,
        suggestedImage: closeMatch,
      });
    } else {
      unmatchedProducts.push({
        id: product.id,
        name: product.name,
        productCode: rawCode,
      });
    }
  }
}

// ============================= WRITE OUTPUTS =============================
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedProducts, null, 2));
fs.writeFileSync(
  UNUSED_IMAGES_FILE,
  imageFiles.filter((f) => !usedImages.has(f)).join("\n")
);
fs.writeFileSync(
  UNMATCHED_PRODUCTS_FILE,
  JSON.stringify(unmatchedProducts, null, 2)
);
fs.writeFileSync(
  MATCHED_BUT_SPEC_FILE,
  matchedButSpec
    .map(
      (m) =>
        `Product: ${m.name}\nSuggested Image: ${m.suggestedImage}\nProduct Code: ${m.productCode}\n---\n`
    )
    .join("\n")
);

// ============================= SUMMARY =============================
console.log(`\n--- SUMMARY ---`);
console.log(`${updatedProducts.length} products updated → ${OUTPUT_FILE}`);
console.log(
  `${matchedButSpec.length} possible but needs review → ${MATCHED_BUT_SPEC_FILE}`
);
console.log(
  `${unmatchedProducts.length} unmatched → ${UNMATCHED_PRODUCTS_FILE}`
);
console.log(
  `${imageFiles.length - usedImages.size} unused images → ${UNUSED_IMAGES_FILE}`
);
