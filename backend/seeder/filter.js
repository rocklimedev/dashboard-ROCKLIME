const fs = require("fs");

// The brandId you want to filter
const BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";

// Input and output file paths
const INPUT_FILE = "seeder/backup/products.json";
const OUTPUT_FILE = "./new.json";

try {
  // Read and parse product.json
  const data = fs.readFileSync(INPUT_FILE, "utf8");
  const products = JSON.parse(data);

  // Filter products by brandId
  const filteredProducts = products.filter((item) => item.brandId === BRAND_ID);

  // Write filtered products to new.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filteredProducts, null, 2));

  console.log(
    `✅ Filtered ${filteredProducts.length} products for brandId: ${BRAND_ID}`
  );
  console.log(`💾 Saved to ${OUTPUT_FILE}`);
} catch (error) {
  console.error("❌ Error processing file:", error.message);
}
