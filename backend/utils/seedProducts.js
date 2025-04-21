const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const Product = require("../models/product");

async function seedProducts() {
  try {
    const dataPath = path.join(__dirname, "../updatedNoProductCode.json");
    const rawData = fs.readFileSync(dataPath);
    const products = JSON.parse(rawData);
    const now = new Date();

    const productCodeCount = {};
    const duplicateProductCodes = new Set();
    const skippedCompanyCodes = new Set();

    // Step 1: Detect duplicate product_code in JSON
    for (const item of products) {
      if (!item.product_code) continue;
      const code = item.product_code.trim();
      productCodeCount[code] = (productCodeCount[code] || 0) + 1;
      if (productCodeCount[code] > 1) {
        duplicateProductCodes.add(code);
      }
    }

    // Step 2: Insert or update products
    await Promise.all(
      products.map(async (p) => {
        const companyCode = String(p.company_code || "").trim();
        if (!companyCode) {
          skippedCompanyCodes.add(companyCode);
          return;
        }

        const existingProduct = await Product.findOne({
          where: { company_code: companyCode },
        });

        const productGroup = (p.productGroup || p.product_segment || "").trim();
        const sellingPrice =
          typeof p.sellingPrice === "number" ? p.sellingPrice : 0;
        const purchasingPrice =
          typeof p.purchasingPrice === "number"
            ? p.purchasingPrice
            : sellingPrice;

        const productData = {
          id: uuidv4(),
          name: p.name?.trim() || null,
          product_segment: p.product_segment?.trim() || null,
          productGroup: productGroup || null,
          sellingPrice: sellingPrice,
          purchasingPrice: purchasingPrice,
          quantity: 20,
          product_code: p.product_code?.trim() || null,
          company_code: companyCode,
          brandId: p.brandId || null,
          categoryId: p.categoryId || null,
          is_active: true,
          createdAt: now,
          updatedAt: now,
        };

        if (
          !productData.productGroup ||
          productData.sellingPrice === null ||
          productData.purchasingPrice === null
        ) {
          console.warn(`❌ Skipping ${companyCode}: Required field is missing`);
          skippedCompanyCodes.add(companyCode);
          return;
        }

        if (existingProduct) {
          await existingProduct.update(productData);
          console.log(`🔄 Updated: ${companyCode}`);
        } else {
          await Product.create(productData);
          console.log(`✅ Inserted: ${companyCode}`);
        }
      })
    );

    // Step 3: Report
    if (duplicateProductCodes.size > 0) {
      console.log(
        `⚠️ Duplicate product codes: ${[...duplicateProductCodes].join(", ")}`
      );
    }

    if (skippedCompanyCodes.size > 0) {
      console.log(
        `🚫 Skipped due to missing fields: ${skippedCompanyCodes.size}`
      );
    }

    console.log("🎉 Product seeding completed.");
  } catch (err) {
    console.error("❌ Error inserting/updating products:", err);
  }
}

seedProducts();
