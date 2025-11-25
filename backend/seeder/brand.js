const fs = require("fs");
const path = require("path");
const products = require("./updated.json");

const IMAGES_DIR = path.join(__dirname, "images");

// Extract filename correctly (decode %20 etc.)
function extractFilename(url) {
  if (!url || typeof url !== "string") return null;

  try {
    const u = new URL(url);
    let filename = decodeURIComponent(path.basename(u.pathname));
    return filename.trim() || null;
  } catch {
    console.log("Invalid URL:", url);
    return null;
  }
}

// Case-insensitive file existence check
function fileExistsInsensitive(filename) {
  if (!filename) return false;

  const target = filename.toLowerCase();
  const files = fs.readdirSync(IMAGES_DIR);

  return files.some((f) => f.toLowerCase() === target);
}

function normalizeImagesField(images) {
  if (!images) return [];

  try {
    if (typeof images === "string") return JSON.parse(images);
    if (Array.isArray(images)) return images;
    return [];
  } catch (e) {
    console.log("JSON parse fail for images:", images);
    return [];
  }
}

let updatedCount = 0;
let usedFilenames = new Set();

for (const product of products) {
  const imgList = normalizeImagesField(product.images);

  console.log("\n=============================");
  console.log("PRODUCT:", product.productId);
  console.log("=============================");

  const validImages = imgList.filter((url) => {
    const filename = extractFilename(url);
    const exists = fileExistsInsensitive(filename);

    console.log("URL:", url);
    console.log(" → filename:", filename);
    console.log(" → exists:", exists);

    if (exists) usedFilenames.add(filename.toLowerCase());
    return exists;
  });

  if (validImages.length === 0) {
    console.log(' → ACTION: No valid images → setting images = ""');
    if (product.images !== "") updatedCount++;
    product.images = "";
  } else {
    console.log(" → ACTION: Keeping valid images:", validImages);
    product.images = JSON.stringify(validImages);
  }
}

// Save cleaned data
fs.writeFileSync("data_cleaned.json", JSON.stringify(products, null, 2));

console.log("\n===================================");
console.log("FINAL SUMMARY: Updated products:", updatedCount);
console.log("===================================");

// --------------------
// FIND UNUSED IMAGES
// --------------------
const allFiles = fs.readdirSync(IMAGES_DIR).map((f) => f.toLowerCase());

const unused = allFiles.filter((f) => !usedFilenames.has(f));

// Write unused images to txt file
fs.writeFileSync("unused_images.txt", unused.join("\n"), "utf8");

console.log("\n===================================");
console.log("UNUSED IMAGES:", unused.length);
console.log("Saved to unused_images.txt");
console.log("===================================");
