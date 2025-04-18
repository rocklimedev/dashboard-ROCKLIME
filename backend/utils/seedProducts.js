const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const Product = require("../models/product");

async function seedProducts() {
  try {
    const dataPath = path.join(__dirname, "./filteredProducts.json");
    const rawData = fs.readFileSync(dataPath);
    const products = JSON.parse(rawData);
    const now = new Date();

    const productCodeCount = {};
    const duplicateProductCodes = new Set();
    const dbProductCodeDuplicates = new Set();
    const dbCompanyCodeDuplicates = new Set();
    const skippedCompanyCodes = new Set();

    // Step 1: Count product_code duplicates in JSON
    for (const item of products) {
      if (!item.product_code) continue;
      const code = item.product_code.trim();
      productCodeCount[code] = (productCodeCount[code] || 0) + 1;
      if (productCodeCount[code] > 1) {
        duplicateProductCodes.add(code);
      }
    }

    // Step 2: Fetch existing product_codes and company_codes from DB
    const allProductCodes = products
      .map((p) => p.product_code?.trim())
      .filter(Boolean);
    const allCompanyCodes = products
      .map((p) => p.company_code?.trim())
      .filter(Boolean);

    const existingProducts = await Product.findAll({
      where: { product_code: allProductCodes },
      attributes: ["product_code"],
      raw: true,
    });

    const existingCompanies = await Product.findAll({
      where: { company_code: allCompanyCodes },
      attributes: ["company_code"],
      raw: true,
    });

    const existingProductCodeSet = new Set(
      existingProducts.map((p) => p.product_code.trim())
    );
    const existingCompanyCodeSet = new Set(
      existingCompanies.map((p) => p.company_code.trim())
    );

    const mappedProducts = [];

    // Step 3: Build final product list
    for (const item of products) {
      const product_code = item.product_code?.trim();
      const company_code = item.company_code?.trim();

      // Skip if no product_code
      if (!product_code || !company_code) {
        skippedCompanyCodes.add(company_code);
        continue;
      }

      // Skip if duplicate in JSON
      if (duplicateProductCodes.has(product_code)) {
        skippedCompanyCodes.add(company_code);
        continue;
      }

      // Skip if product_code exists in DB
      if (existingProductCodeSet.has(product_code)) {
        dbProductCodeDuplicates.add(product_code);
        skippedCompanyCodes.add(company_code);
        continue;
      }

      // Skip if company_code exists in DB
      if (existingCompanyCodeSet.has(company_code)) {
        dbCompanyCodeDuplicates.add(company_code);
        skippedCompanyCodes.add(company_code);
        continue;
      }

      // Passed all checks
      mappedProducts.push({
        productId: uuidv4(),
        name: item.name,
        company_code,
        product_code,
        categoryId: item.categoryId,
        brandId: item.brandId,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        purchasingPrice: item.purchasingPrice,
        description: item.description || null,
        images: JSON.stringify(item.images || []),
        productGroup: item.productGroup,
        product_segment: item.product_segment,
        discountType: null,
        barcode: null,
        alert_quantity: null,
        tax: null,
        createdAt: now,
        updatedAt: now,
        user_id: null,
        isFeatured: 0,
      });
    }

    // Step 4: Insert into DB
    if (mappedProducts.length > 0) {
      const insertedProducts = await Product.bulkCreate(mappedProducts, {
        validate: true,
        individualHooks: true,
      });
      console.log(
        `✅ ${insertedProducts.length} products inserted successfully.`
      );
    } else {
      console.log("⚠️ No products to insert.");
    }

    // Step 5: Write logs
    const logsDir = path.join(__dirname, "./logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

    if (duplicateProductCodes.size > 0) {
      fs.writeFileSync(
        path.join(logsDir, "duplicateInJSON.txt"),
        Array.from(duplicateProductCodes).join("\n")
      );
    }

    if (dbProductCodeDuplicates.size > 0) {
      fs.writeFileSync(
        path.join(logsDir, "duplicateProductCodeInDB.txt"),
        Array.from(dbProductCodeDuplicates).join("\n")
      );
    }

    if (dbCompanyCodeDuplicates.size > 0) {
      fs.writeFileSync(
        path.join(logsDir, "duplicateCompanyCodeInDB.txt"),
        Array.from(dbCompanyCodeDuplicates).join("\n")
      );
    }

    if (skippedCompanyCodes.size > 0) {
      fs.writeFileSync(
        path.join(logsDir, "skippedCompanyCodes.txt"),
        Array.from(skippedCompanyCodes).join("\n")
      );
    }

    console.log("📁 Logs written to ./logs folder");
  } catch (error) {
    console.error("❌ Error inserting products:", error);
  }
}

seedProducts();
