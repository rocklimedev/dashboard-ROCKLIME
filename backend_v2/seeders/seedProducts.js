const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");

// Models
const Product = require("../models/product");
const Brand = require("../models/brand");
const Category = require("../models/category");

async function seedProducts() {
  try {
    await sequelize.sync();

    const dataPath = path.join(__dirname, "../cleaned.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const products = JSON.parse(rawData);

    const productData = [];
    const skippedProductCodes = new Set();
    const seenProductCodes = new Set();

    for (const product of products) {
      const productCode = product["Product Code"];
      const companyCode = product["Company Code"];

      if (!productCode || !companyCode) {
        console.warn("⚠️ Missing product_code or company_code:", product);
        if (productCode) skippedProductCodes.add(productCode);
        continue;
      }

      // Check for duplicates in JSON
      if (seenProductCodes.has(productCode)) {
        console.warn(
          `📄 Duplicate in JSON found for product code: ${productCode}`
        );
        skippedProductCodes.add(productCode);
        continue;
      }
      seenProductCodes.add(productCode);

      // Check for duplicates in DB
      const existing = await Product.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { product_code: productCode },
            { company_code: companyCode },
          ],
        },
      });

      if (existing) {
        console.warn(
          `⏭️ Duplicate product in DB (code: ${productCode}, company: ${companyCode}) — skipped`
        );
        skippedProductCodes.add(productCode);
        continue;
      }

      // Lookup brand (optional)
      let brandId = null;
      if (product["Brand_Slug"]) {
        const brand = await Brand.findOne({
          where: { brandSlug: product["Brand_Slug"] },
        });
        if (!brand) {
          console.warn(
            `⚠️ Brand not found for slug: ${product["Brand_Slug"]} (set null)`
          );
        } else {
          brandId = brand.id;
        }
      }

      // Lookup category (optional)
      let categoryId = null;
      if (product["Category_Name"]) {
        const category = await Category.findOne({
          where: { name: product["Category_Name"] },
        });
        if (!category) {
          console.warn(
            `⚠️ Category not found: ${product["Category_Name"]} (set null)`
          );
        } else {
          categoryId = category.categoryId;
        }
      }

      // Parse prices
      const mrp = parseFloat(
        product["MRP"]?.toString().replace(/[^0-9.]/g, "") || "0"
      );

      productData.push({
        productId: uuidv4(),
        productSegment: product["Product Segment"] || null,
        productGroup: product["Product group"] || null,
        name: product["Product Description"] || null,
        product_code: productCode,
        company_code: companyCode,
        sellingPrice: mrp,
        purchasingPrice: mrp * 0.8,
        quantity: 100,
        discountType: "percent",
        barcode: uuidv4(),
        alert_quantity: 10,
        tax: 18.0,
        description: product["Product Description"] || null,
        images: JSON.stringify([]),
        brandId,
        categoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Insert valid products
    if (productData.length > 0) {
      await Product.bulkCreate(productData);
      console.log(`✅ Seeded ${productData.length} new products.`);
    } else {
      console.log("⚠️ No new products to seed.");
    }

    // Write skipped product codes
    if (skippedProductCodes.size > 0) {
      const dupPath = path.join(__dirname, "./DUPLICATE.TXT");
      fs.writeFileSync(dupPath, [...skippedProductCodes].join("\n"), "utf-8");
      console.log(`📝 Skipped product codes written to DUPLICATE.TXT`);
    }
  } catch (error) {
    console.error("❌ Error seeding products:", error);
  } finally {
    await sequelize.close();
  }
}

seedProducts();
