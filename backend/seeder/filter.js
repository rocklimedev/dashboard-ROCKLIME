const fs = require("fs");
const path = require("path");

// Constants
const PRODUCTS_FILE = "./seeder/backup/products_backup.json";
const IMAGES_DIR = "./seeder/images";
const OUTPUT_FILE = "./updated.json";
const UNUSED_IMAGES_FILE = "./unused_images3.txt";
const COMPANY_CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const BASE_URL = "https://static.cmtradingco.com/product_images/";

// Step 1: Load product data
const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));

// Step 2: Get available image filenames
const imageFiles = fs.readdirSync(IMAGES_DIR);
const availableImages = new Set(
  imageFiles.map((file) => path.parse(file).name)
);

// Step 3: Update only matching products
const updatedProducts = [];
const usedImages = new Set();

for (const product of products) {
  const meta = product.meta || {};
  const companyCode = meta[COMPANY_CODE_KEY];

  if (companyCode && availableImages.has(String(companyCode))) {
    const extFile = imageFiles.find(
      (f) => path.parse(f).name === String(companyCode)
    );

    const newImageURL = `${BASE_URL}${extFile}`;
    product.images = JSON.stringify([newImageURL]);
    product.updatedAt = new Date().toISOString();

    updatedProducts.push(product);
    usedImages.add(String(companyCode));
  }
}

// Step 4: Write updated products
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedProducts, null, 2));

// Step 5: Write unused images to text file
const unusedImages = imageFiles.filter(
  (f) => !usedImages.has(path.parse(f).name)
);
fs.writeFileSync(UNUSED_IMAGES_FILE, unusedImages.join("\n"));

console.log(
  `✅ ${updatedProducts.length} products updated and written to ${OUTPUT_FILE}`
);
console.log(
  `🗂️ ${unusedImages.length} unused images listed in ${UNUSED_IMAGES_FILE}`
);
