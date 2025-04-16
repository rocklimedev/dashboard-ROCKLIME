const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database"); // Update path if needed
const Product = require("../models/product"); // Update path if needed

async function generateProductCodeFile() {
  try {
    await sequelize.sync();

    const products = await Product.findAll({
      attributes: ["product_code", "company_code"],
      raw: true,
    });

    if (!products.length) {
      console.log("⚠️ No products found in DB.");
      return;
    }

    const groupedByProductCode = {};

    for (const { product_code, company_code } of products) {
      if (!product_code || !company_code) continue;

      if (!groupedByProductCode[product_code]) {
        groupedByProductCode[product_code] = [];
      }

      groupedByProductCode[product_code].push(company_code);
    }

    const sortedCodes = Object.keys(groupedByProductCode).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    let output = "";
    let duplicates = [];

    for (const code of sortedCodes) {
      const companies = groupedByProductCode[code];

      if (companies.length === 1) {
        output += `${code} — ${companies[0]}\n`;
      } else {
        duplicates.push(code); // Save duplicates for DUPLICATE.TXT
        output += `${code} —\n`;
        companies.forEach((company, i) => {
          output += `  ${i + 1}. ${company}\n`;
        });
      }
    }

    // Write PRODUCTCODE.TXT
    const outputPath = path.join(__dirname, "PRODUCTCODE.TXT");
    fs.writeFileSync(outputPath, output, "utf-8");
    console.log("✅ PRODUCTCODE.TXT created successfully.");

    // Write DUPLICATE.TXT
    if (duplicates.length > 0) {
      const dupPath = path.join(__dirname, "DUPLICATE.TXT");
      fs.writeFileSync(dupPath, duplicates.join("\n"), "utf-8");
      console.log("📝 DUPLICATE.TXT created with duplicate product codes.");
    } else {
      console.log("✅ No duplicate product codes found.");
    }
  } catch (err) {
    console.error("❌ Error generating PRODUCTCODE.TXT:", err);
  } finally {
    await sequelize.close();
  }
}

generateProductCodeFile();
