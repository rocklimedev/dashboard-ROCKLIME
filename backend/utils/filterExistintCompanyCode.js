const fs = require("fs");
const path = require("path");
const Product = require("../models/product"); // Sequelize Product model

async function filterExistingCompanyCodes() {
  try {
    const inputPath = path.join(__dirname, "../filteredProducts.json");
    const rawData = fs.readFileSync(inputPath, "utf-8");
    const products = JSON.parse(rawData);

    // Extract all non-empty, trimmed company_codes
    const allCodes = products
      .map((p) => p.company_code?.trim())
      .filter(Boolean);

    const uniqueCodes = [...new Set(allCodes)];

    // Fetch products from DB that already have these company_codes
    const existing = await Product.findAll({
      where: { company_code: uniqueCodes },
      attributes: ["company_code"],
      raw: true,
    });

    const existingCodes = new Set(existing.map((p) => p.company_code));

    // Filter out the products that already exist in DB
    const filtered = products.filter(
      (item) => !existingCodes.has(item.company_code?.trim())
    );

    // Overwrite the same file with filtered results
    fs.writeFileSync(inputPath, JSON.stringify(filtered, null, 2));

    console.log(`✅ Total input products: ${products.length}`);
    console.log(`🟢 Final saved (not in DB): ${filtered.length}`);
    console.log(
      `🔴 Removed (already in DB): ${products.length - filtered.length}`
    );
    console.log("📁 Updated original JSON file with filtered data.");
  } catch (err) {
    console.error("❌ Error filtering products:", err);
  }
}

filterExistingCompanyCodes();
