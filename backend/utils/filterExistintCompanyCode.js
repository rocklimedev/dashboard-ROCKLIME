const fs = require("fs");
const path = require("path");
const Product = require("../models/product"); // Sequelize Product model

async function filterExistingCompanyCodes() {
  try {
    const inputPath = path.join(__dirname, "../dummy.json");
    const rawData = fs.readFileSync(inputPath, "utf-8");
    const products = JSON.parse(rawData);

    // Extract all non-empty, trimmed company_codes from JSON
    const allCodes = products
      .map((p) => p["company_code"]?.toString().trim())
      .filter(Boolean);

    const uniqueCodes = [...new Set(allCodes)];

    // Fetch matching company_codes from DB
    const existing = await Product.findAll({
      where: { company_code: uniqueCodes }, // Sequelize field
      attributes: ["company_code"], // Sequelize field, not JSON key
      raw: true,
    });

    const existingCodes = new Set(
      existing.map((p) => p.company_code?.toString())
    );

    // Filter out those already in DB
    const filtered = products.filter(
      (item) => !existingCodes.has(item["company_code"]?.toString().trim())
    );

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
