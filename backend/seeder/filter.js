const fs = require("fs");

// Input and output files
const INPUT_FILE = "./seeder/backup/products_backup.json";
const OUTPUT_FILE = "./duplicates.json";

try {
  // Read and parse product.json
  const data = fs.readFileSync(INPUT_FILE, "utf8");
  const products = JSON.parse(data);

  // Map to track unique combinations
  const seen = new Map();
  const duplicates = [];

  for (const product of products) {
    const name = (product.name || "").trim().toLowerCase();
    const meta = product.meta || {};
    const price = meta["9ba862ef-f993-4873-95ef-1fef10036aa5"];
    const companyCode = meta["d11da9f9-3f2e-4536-8236-9671200cca4a"];

    // Unique key = name + price + companyCode
    const key = `${name}__${price}__${companyCode}`;

    if (seen.has(key)) {
      // If already seen, push both current and first duplicate if not already added
      const firstProduct = seen.get(key);
      if (!duplicates.includes(firstProduct)) duplicates.push(firstProduct);
      duplicates.push(product);
    } else {
      seen.set(key, product);
    }
  }

  // Write duplicates to new file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(duplicates, null, 2));

  console.log(`✅ Found ${duplicates.length} duplicate entries.`);
  console.log(`💾 Saved to ${OUTPUT_FILE}`);
} catch (err) {
  console.error("❌ Error:", err.message);
}
