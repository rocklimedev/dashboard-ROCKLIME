const fs = require("fs");
const path = require("path");
const Product = require("../models/product");
const Category = require("../models/category");
const Brand = require("../models/brand");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

async function updateProductCodesInJson() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database.");

    const filePath = path.join(__dirname, "../utils/filteredProducts.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const productsData = JSON.parse(rawData);

    const updatedProducts = [];

    for (const product of productsData) {
      // If product_code is already present, double check it's actually unique
      if (product.product_code && product.product_code.trim() !== "") {
        const exists = await Product.findOne({
          where: { product_code: product.product_code.trim() },
        });

        if (exists) {
          console.warn(
            `⚠️ "${product.name}" has conflicting code ${product.product_code}. Regenerating...`
          );
        } else {
          updatedProducts.push(product);
          continue; // Code is unique, keep it
        }
      }

      const category = await Category.findByPk(product.categoryId);
      const brand = await Brand.findByPk(product.brandId);

      if (!category || !brand) {
        console.warn(
          `⚠️ Skipping "${product.name}" due to missing category/brand`
        );
        updatedProducts.push(product);
        continue;
      }

      const prefix = `E${category.name
        .slice(0, 2)
        .toUpperCase()}${brand.brandSlug
        .slice(0, 2)
        .toUpperCase()}${product.company_code.slice(-4)}`;

      // Fetch all product codes starting with prefix
      const existingProducts = await Product.findAll({
        where: {
          product_code: {
            [Op.like]: `${prefix}%`,
          },
        },
        attributes: ["product_code"],
      });

      const existingSuffixes = existingProducts
        .map((p) => p.product_code.replace(prefix, ""))
        .filter((code) => /^\d{3}$/.test(code))
        .map(Number);

      let suffix = 1;
      let generatedCode;
      let isUnique = false;

      // Keep generating until a unique code is found
      while (!isUnique) {
        while (existingSuffixes.includes(suffix)) {
          suffix++;
        }

        generatedCode = `${prefix}${suffix.toString().padStart(3, "0")}`;
        const conflictCheck = await Product.findOne({
          where: { product_code: generatedCode },
        });

        if (!conflictCheck) {
          isUnique = true;
        } else {
          suffix++; // Try next
        }
      }

      product.product_code = generatedCode;
      updatedProducts.push(product);
      console.log(`✅ Updated: "${product.name}" → ${generatedCode}`);
    }

    fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2));
    console.log("📝 updatedNoProductCode.json updated successfully.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sequelize.close();
  }
}

updateProductCodesInJson();
