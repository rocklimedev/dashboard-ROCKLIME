const fs = require("fs");

const INPUT_FILE =
  "./seeder/backup/products_backup_2026-01-24T04-40-23-847Z.json"; // your full backup
const OUTPUT_FILE = "filtered-products.json";
const TARGET_BRAND_ID = "4e3acf32-1e47-4d38-a6bb-417addd52ac0";

const products = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

const filtered = products.filter((p) => p.brandId === TARGET_BRAND_ID);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filtered, null, 2));

console.log(`✅ Extracted ${filtered.length} products`);
