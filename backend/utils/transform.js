const fs = require("fs");
const path = require("path");

const referenceFolder = path.join(__dirname, "json-outputs"); // folder with price data
const seederFilePath = path.join(__dirname, "products_backup.json"); // your main seeder JSON file
const outputFilePath = path.join(__dirname, "seeder-updated.json");

// Map to store code → price from all JSON files
const codePriceMap = new Map();

// ✅ Step 1: Load all reference JSON files
const referenceFiles = fs
  .readdirSync(referenceFolder)
  .filter((f) => f.endsWith(".json"));

for (const file of referenceFiles) {
  const filePath = path.join(referenceFolder, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Each file contains categories → array of products
  for (const category in data) {
    const products = data[category];
    products.forEach((prod) => {
      if (prod.Code && prod.Price !== undefined && prod.Price !== null) {
        const code = String(prod.Code).trim();
        const price = Number(prod.Price);
        codePriceMap.set(code, price);
      }
    });
  }
}

console.log(
  `✅ Loaded ${codePriceMap.size} product prices from reference JSONs.`
);

// ✅ Step 2: Load seeder JSON
if (!fs.existsSync(seederFilePath)) {
  console.error("❌ Seeder file not found:", seederFilePath);
  process.exit(1);
}

const seederData = JSON.parse(fs.readFileSync(seederFilePath, "utf-8"));

// Keys to match inside meta
const CODE_KEY = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const PRICE_KEY = "9ba862ef-f993-4873-95ef-1fef10036aa5";

let updatedCount = 0;

// ✅ Step 3: Update prices in seeder
seederData.forEach((prod) => {
  const code = prod?.meta?.[CODE_KEY];
  if (!code) return;

  const referencePrice = codePriceMap.get(String(code).trim());
  if (referencePrice !== undefined) {
    const currentPrice = Number(prod.meta?.[PRICE_KEY]);

    if (currentPrice !== referencePrice) {
      prod.meta[PRICE_KEY] = String(referencePrice);
      // store as number, not string
      updatedCount++;
      console.log(
        `🔄 Updated price for ${code}: ${currentPrice} → ${referencePrice}`
      );
    }
  }
});

console.log(`✅ Updated ${updatedCount} products in seeder.`);

// ✅ Step 4: Save updated JSON
fs.writeFileSync(outputFilePath, JSON.stringify(seederData, null, 2), "utf-8");
console.log(`💾 Saved updated seeder file at: ${outputFilePath}`);
