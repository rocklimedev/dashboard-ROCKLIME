const fs = require("fs");
const path = require("path");
const Product = require("../models/product");
const Category = require("../models/category");
const Brand = require("../models/brand");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

const FILE_NAME = "output.json"; // change this if you rename the file
const FILE_PATH = path.join(__dirname, "../", FILE_NAME);

async function generateCode(product, category, brand) {
  const match = product.company_code?.match(/\d{4}(?!.*\d)/);
  const last4 = match ? match[0] : "0000";
  const prefix = `E${category.name.slice(0, 2).toUpperCase()}${brand.brandName
    .slice(0, 2)
    .toUpperCase()}${last4}`;

  const existing = await Product.findAll({
    where: { product_code: { [Op.like]: `${prefix}%` } },
    attributes: ["product_code"],
  });

  const suffixes = existing
    .map((p) => p.product_code.replace(prefix, ""))
    .filter((s) => /^\d{3}$/.test(s))
    .map(Number);

  let suffix = 1;
  while (suffixes.includes(suffix)) suffix++;

  return `${prefix}${suffix.toString().padStart(3, "0")}`;
}

async function updateFilteredJsonOnly() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database.");

    const data = fs.readFileSync(FILE_PATH, "utf-8");
    const products = JSON.parse(data);
    const updated = [];

    for (const product of products) {
      const code = product.product_code?.trim();

      if (code) {
        const existing = await Product.findOne({
          where: { product_code: code },
        });

        if (!existing) {
          updated.push(product);
          continue;
        }

        console.log(
          `⚠️ Conflict for "${product.name}" → ${code}, regenerating.`
        );
      }

      const category = await Category.findByPk(product.categoryId);
      const brand = await Brand.findByPk(product.brandId);

      if (!category || !brand) {
        console.warn(
          `⚠️ Skipping "${product.name}" due to missing category/brand`
        );
        updated.push(product);
        continue;
      }

      const newCode = await generateCode(product, category, brand);
      product.product_code = newCode;
      console.log(`✅ "${product.name}" → ${newCode}`);
      updated.push(product);
    }

    fs.writeFileSync(FILE_PATH, JSON.stringify(updated, null, 2));
    console.log(`📝 ${FILE_NAME} updated successfully.`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await sequelize.close();
  }
}

updateFilteredJsonOnly();
