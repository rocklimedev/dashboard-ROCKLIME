// update_images.js
const fs = require("fs");
const path = require("path");

// CONFIG
const PRODUCTS_FILE = "./seeder/backup/products_backup.json";
const IMAGES_DIR = "./seeder/images";
const OUTPUT_FILE = "./updated.json";
const UNUSED_IMAGES_FILE = "./unused_images3.txt";
const UNMATCHED_PRODUCTS_FILE = "./unmatched_products.json";
const COMPANY_CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const BASE_URL = "https://static.cmtradingco.com/product_images/";

// Helpers
function normalize(str) {
  return String(str || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Load data
const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
const imageFiles = fs.readdirSync(IMAGES_DIR).filter((f) => !f.startsWith("."));

console.log(`Found ${imageFiles.length} image files.`);

// Build an index: token -> [filenames]
const imageIndex = new Map();

function indexImage(file) {
  const basename = path.parse(file).name;
  const lower = basename.toLowerCase();

  // 1) parenthesis groups as tokens: "(1038)" -> "1038", "(FULL FRAME)" -> "full frame"
  const parenMatches = [...lower.matchAll(/\(([^)]+)\)/g)].map((m) =>
    normalize(m[1])
  );
  parenMatches.forEach((tok) => {
    if (!tok) return;
    const list = imageIndex.get(tok) || [];
    list.push(file);
    imageIndex.set(tok, list);
  });

  // 2) tokenise on non-word characters but preserve hyphenated tokens (COL-4013)
  const tokens = lower
    .split(/[^\w-]+/)
    .filter(Boolean)
    .map(normalize);
  tokens.forEach((tok) => {
    if (!tok) return;
    const list = imageIndex.get(tok) || [];
    list.push(file);
    imageIndex.set(tok, list);
  });

  // 3) full basename as a token
  const full = normalize(basename);
  if (full) {
    const list = imageIndex.get(full) || [];
    list.push(file);
    imageIndex.set(full, list);
  }
}

imageFiles.forEach(indexImage);

// Matching products
const updatedProducts = [];
const usedImages = new Set();
const unmatchedProducts = [];

for (const product of products) {
  const meta = product.meta || {};
  const rawCode = meta[COMPANY_CODE_KEY];

  if (!rawCode && rawCode !== 0) {
    // no company code present, skip
    continue;
  }

  const code = normalize(String(rawCode));
  let matchedFile = null;

  // 1) direct token lookup
  const candidates = imageIndex.get(code);
  if (Array.isArray(candidates) && candidates.length > 0) {
    // choose first unused candidate, otherwise first candidate
    matchedFile = candidates.find((f) => !usedImages.has(f)) || candidates[0];
  }

  // 2) fallback: regex search across all filenames (word boundary or exact substring)
  if (!matchedFile) {
    const rx = new RegExp(`\\b${escapeRegExp(code)}\\b`, "i");
    matchedFile = imageFiles.find((f) => rx.test(path.parse(f).name));
  }

  // 3) final fallback: substring anywhere in filename
  if (!matchedFile) {
    const substr = code.replace(/\s+/g, "");
    if (substr) {
      matchedFile = imageFiles.find((f) =>
        path.parse(f).name.toLowerCase().replace(/\s+/g, "").includes(substr)
      );
    }
  }

  if (matchedFile) {
    const newImageURL = `${BASE_URL}${matchedFile}`;
    product.images = JSON.stringify([newImageURL]);
    product.updatedAt = new Date().toISOString();
    updatedProducts.push(product);
    usedImages.add(matchedFile);
  } else {
    unmatchedProducts.push({
      id: product.id || product._id || null,
      name: product.name || product.title || "(no name)",
      companyCode: rawCode,
    });
  }
}

// Write outputs
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedProducts, null, 2));
fs.writeFileSync(
  UNUSED_IMAGES_FILE,
  imageFiles.filter((f) => !usedImages.has(f)).join("\n")
);
fs.writeFileSync(
  UNMATCHED_PRODUCTS_FILE,
  JSON.stringify(unmatchedProducts, null, 2)
);

// Summary
console.log(`${updatedProducts.length} products updated -> ${OUTPUT_FILE}`);
console.log(
  `${
    imageFiles.length - usedImages.size
  } unused images -> ${UNUSED_IMAGES_FILE}`
);
console.log(
  `${unmatchedProducts.length} products had no matching image -> ${UNMATCHED_PRODUCTS_FILE}`
);
