const fs = require("fs");
const path = require("path");

// CONFIG
const productsJsonPath = "./seeder/backup/products_backup.json";
const cdnRoot = "./product_images";
const outputRoot = "./new_images";

// Load product data
const products = JSON.parse(fs.readFileSync(productsJsonPath, "utf8"));

// Step 1: Extract image filenames from all products
const usedFiles = new Set();

for (const product of products) {
  let imagesRaw = product.images;
  if (!imagesRaw || imagesRaw === "[]" || imagesRaw.trim() === "") continue;

  let imageList = [];

  // handle various forms (array, JSON string, double-encoded JSON)
  try {
    if (typeof imagesRaw === "string") {
      // Sometimes stringified twice, e.g. "[\"https://...\"]"
      try {
        imageList = JSON.parse(imagesRaw);
        if (typeof imageList === "string") imageList = JSON.parse(imageList);
      } catch {
        imageList = [imagesRaw];
      }
    } else if (Array.isArray(imagesRaw)) {
      imageList = imagesRaw;
    }
  } catch {
    continue;
  }

  // extract filenames from URLs
  for (const img of imageList) {
    if (!img || typeof img !== "string") continue;
    const match = img.match(/\/product_images\/(.+?)$/i);
    if (match) {
      const fileName = path.basename(match[1]);
      usedFiles.add(fileName);
    }
  }
}

console.log(`Total used image filenames: ${usedFiles.size}`);

// Step 2: Recursively list all CDN files
function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const allFiles = walkDir(cdnRoot);
console.log(`Total images found: ${allFiles.length}`);

// Step 3: Copy only used images to new_images/
let copiedCount = 0;

for (const src of allFiles) {
  const fileName = path.basename(src);
  if (!usedFiles.has(fileName)) continue;

  const relativePath = path.relative(cdnRoot, src);
  const dest = path.join(outputRoot, relativePath);

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copiedCount++;
}

console.log(`Copied ${copiedCount} used images to ${outputRoot}`);
console.log("Now you can safely replace product_images with new_images.");
