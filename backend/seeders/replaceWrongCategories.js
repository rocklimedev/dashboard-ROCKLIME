const fs = require("fs");
const path = require("path");
const Product = require("../models/product");
const Category = require("../models/category");

// Parent category to filename mapping
const parentCategories = {
  "1a76fdf5-a380-4a62-867c-ca32f6bd7f29": "GROHE KITCHEN.json",
  "282b5212-88b7-4ae8-9a6c-049a285c5f70": "American Standard.json",
  "34e5ad50-2d39-4dfe-8726-cb4db364d84d": "GROHE BAO.json",
  "7a5e2bd8-8dfe-4511-a098-6ffd13e0a178": "Grohe Colour.json",
  "80afdfa6-2124-4c58-8d1e-116f9f7d8c56": "GROHE PREMIUM.json",
};
//category
// "0e718b1d-a0ab-47a7-bb51-021e522b5596"	"Sanitary"

// "748a1b48-aa57-440f-9d85-f6a544b094d5"	"Ceramics"

// "e84647d5-98d8-46b5-bbae-43e140ff81f2"	"Kitchen"
const WRONG_CATEGORY_ID = "e84647d5-98d8-46b5-bbae-43e140ff81f2"; // Default wrong category

async function replaceWrongCategoryProducts() {
  let totalFound = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNewCategories = 0;
  let totalCategoriesIterated = 0;
  let totalProductsProcessed = 0;
  const notFoundProducts = []; // 🆕 Track products not found in DB

  // Helper to get or create category
  async function getOrCreateCategory(name, parentCategoryId) {
    let category = await Category.findOne({ where: { name } });

    if (!category) {
      category = await Category.create({
        name,
        parentCategoryId,
        parentCategory: 1,
      });
      totalNewCategories++;
      console.log(`🆕 Created new category: ${name}`);
    }

    return category;
  }

  // Loop through each parent category
  for (const [parentCategoryId, filename] of Object.entries(parentCategories)) {
    totalCategoriesIterated++;
    const filePath = path.join(__dirname, `../utils/json-outputs/${filename}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filename}`);
      continue;
    }

    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const key in jsonData) {
      const value = jsonData[key];

      if (Array.isArray(value) && value[0]?.Code) {
        // Simple structure
        const subCategory = key;
        const productsArray = value;

        for (const product of productsArray) {
          totalProductsProcessed++;
          const companyCode = product?.Code;
          if (!companyCode) {
            totalSkipped++;
            console.warn("⚠️ Skipping product with missing 'Code':", product);
            continue;
          }

          const dbProduct = await Product.findOne({
            where: {
              company_code: companyCode,
              categoryId: WRONG_CATEGORY_ID,
            },
          });

          if (dbProduct) {
            totalFound++;
            const category = await getOrCreateCategory(
              subCategory,
              parentCategoryId
            );
            dbProduct.categoryId = category.categoryId;
            await dbProduct.save();
            totalUpdated++;

            console.log(
              `✅ Updated Product [${companyCode}] -> Category: ${subCategory}`
            );
          } else {
            notFoundProducts.push(companyCode); // 🆕 Track not found
          }
        }
      } else if (Array.isArray(value)) {
        // Nested structure
        for (const section of value) {
          for (const subCategory in section) {
            const productsArray = section[subCategory];

            for (const product of productsArray) {
              totalProductsProcessed++;
              const companyCode = product?.Code;
              if (!companyCode) {
                totalSkipped++;
                console.warn(
                  "⚠️ Skipping product with missing 'Code':",
                  product
                );
                continue;
              }

              const dbProduct = await Product.findOne({
                where: {
                  company_code: companyCode,
                  categoryId: WRONG_CATEGORY_ID,
                },
              });

              if (dbProduct) {
                totalFound++;
                const category = await getOrCreateCategory(
                  subCategory,
                  parentCategoryId
                );
                dbProduct.categoryId = category.categoryId;
                await dbProduct.save();
                totalUpdated++;

                console.log(
                  `✅ Updated Product [${companyCode}] -> Category: ${subCategory}`
                );
              } else {
                notFoundProducts.push(companyCode); // 🆕 Track not found
              }
            }
          }
        }
      } else {
        console.warn(`❓ Unexpected structure for key "${key}"`);
      }
    }
  }

  // Final Stats
  console.log(`🎯 Total Categories Iterated: ${totalCategoriesIterated}`);
  console.log(`🎯 Total Products Processed: ${totalProductsProcessed}`);
  console.log(`🎯 Total Products Found with Wrong Category: ${totalFound}`);
  console.log(`✅ Total Products Successfully Updated: ${totalUpdated}`);
  console.log(`🚫 Total Products Skipped (missing code): ${totalSkipped}`);
  console.log(`🆕 Total New Categories Created: ${totalNewCategories}`);

  // Log not found products
  if (notFoundProducts.length) {
    console.log(
      `🚫 Total Products NOT Found in DB: ${notFoundProducts.length}`
    );
    console.log("📝 Missing Product Codes:", notFoundProducts);
  } else {
    console.log("✅ All JSON products matched some entry in DB.");
  }

  console.log("🎉 Category replacement complete.");
}

replaceWrongCategoryProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error replacing categories:", err);
    process.exit(1);
  });
