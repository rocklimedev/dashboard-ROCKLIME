const Product = require("../models/product");
const Category = require("../models/category");
const Brand = require("../models/brand");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

async function generateCode(product, category, brand) {
  const match = product.company_code?.match(/\d{4}(?!.*\d)/);
  const last4 = match ? match[0] : "0000";

  const prefix = `E${category.name.slice(0, 2).toUpperCase()}${brand.brandName
    .slice(0, 2)
    .toUpperCase()}${last4}`;

  const existing = await Product.findAll({
    where: {
      product_code: { [Op.like]: `${prefix}%` },
      productId: { [Op.ne]: product.productId }, // avoid current product
    },
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

async function updateAllProductCodes() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database.");

    // ✅ Fetch all products
    const products = await Product.findAll();

    const categoryCache = {};
    const brandCache = {};

    for (const product of products) {
      const { productId, categoryId, brandId } = product;

      const category =
        categoryCache[categoryId] ||
        (categoryCache[categoryId] = await Category.findByPk(categoryId));

      const brand =
        brandCache[brandId] ||
        (brandCache[brandId] = await Brand.findByPk(brandId));

      if (!category || !brand) {
        console.warn(
          `⚠️ Skipping "${product.name}" due to missing category or brand`
        );
        continue;
      }

      const newCode = await generateCode(product, category, brand);

      await Product.update({ product_code: newCode }, { where: { productId } });

      console.log(`✅ "${product.name}" updated → ${newCode}`);
    }

    console.log("🎉 All product codes updated successfully.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await sequelize.close();
  }
}

updateAllProductCodes();
