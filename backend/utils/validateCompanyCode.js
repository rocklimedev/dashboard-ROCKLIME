const fs = require("fs");
const path = require("path");
const Product = require("../models/product"); // Sequelize model

async function validateCompanyCodes() {
  try {
    const dataPath = path.join(__dirname, "./updatedNoProductCode.json");
    const rawData = fs.readFileSync(dataPath);
    const products = JSON.parse(rawData);

    const codeCount = {};
    const duplicatesInJSON = new Set();
    const dbDuplicates = new Set();
    const uniqueValidCodes = [];

    // Step 1: Count occurrences of company_code in JSON
    for (const item of products) {
      const code = item.company_code?.trim();
      if (!code) continue;

      codeCount[code] = (codeCount[code] || 0) + 1;
      if (codeCount[code] > 1) {
        duplicatesInJSON.add(code);
      }
    }

    // Step 2: Check which company_codes already exist in DB
    const codesToCheck = Object.keys(codeCount);
    const existing = await Product.findAll({
      where: {
        company_code: codesToCheck,
      },
      attributes: ["company_code"],
      raw: true,
    });

    const existingCodes = new Set(existing.map((p) => p.company_code));

    // Step 3: Classify valid codes
    for (const code of codesToCheck) {
      if (duplicatesInJSON.has(code)) continue;
      if (existingCodes.has(code)) {
        dbDuplicates.add(code);
        continue;
      }
      uniqueValidCodes.push(code);
    }

    // Step 4: Filter valid products only
    const filteredProducts = products.filter((item) => {
      const code = item.company_code?.trim();
      return code && !duplicatesInJSON.has(code) && !existingCodes.has(code);
    });

    // Prepare directory
    const outputDir = path.join(__dirname, "./logs");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    // Step 5: Write logs
    fs.writeFileSync(
      path.join(outputDir, "validCompanyCodes.txt"),
      uniqueValidCodes.join("\n")
    );

    fs.writeFileSync(
      path.join(outputDir, "duplicatesInJSON.txt"),
      Array.from(duplicatesInJSON).join("\n")
    );

    fs.writeFileSync(
      path.join(outputDir, "duplicatesInDB.txt"),
      Array.from(dbDuplicates).join("\n")
    );

    // New: Log all product objects with duplicate company_code
    const duplicateProducts = products.filter((item) =>
      duplicatesInJSON.has(item.company_code?.trim())
    );
    fs.writeFileSync(
      path.join(outputDir, "duplicateProductsInJSON.json"),
      JSON.stringify(duplicateProducts, null, 2)
    );

    // Save cleaned products
    const cleanedOutputPath = path.join(__dirname, "./filteredProducts.json");
    fs.writeFileSync(
      cleanedOutputPath,
      JSON.stringify(filteredProducts, null, 2)
    );

    console.log("✅ Cleaned JSON saved.");
    console.log("📂 Logs written in ./logs/");
  } catch (err) {
    console.error("❌ Error during validation:", err);
  }
}

validateCompanyCodes();
