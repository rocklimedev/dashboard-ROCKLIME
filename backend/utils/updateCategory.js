const fs = require("fs");
const path = require("path");
const Category = require("../models/category");
const Product = require("../models/product");
const productData = require("./json-outputS/GROHE PREMIUM.json");

const BRAND_ID = "13847c2c-3c91-4bb2-a130-f94928658237";
const notFoundFilePath = path.join(__dirname, "./notFoundProducts.json");

let notFoundProducts = [];

// Load existing not-found products (if any)
if (fs.existsSync(notFoundFilePath)) {
  const existingData = fs.readFileSync(notFoundFilePath, "utf-8");
  notFoundProducts = JSON.parse(existingData || "[]");
}

async function assignCategoryIdsToProducts(productData) {
  for (const [categoryName, categoryValue] of Object.entries(productData)) {
    const category = await Category.findOne({ where: { name: categoryName } });

    if (!category) {
      console.warn(`❌ Category not found: ${categoryName}`);
      continue;
    }

    // Check if categoryValue is an array (which it should be based on the structure you provided)
    if (Array.isArray(categoryValue)) {
      for (const product of categoryValue) {
        if (!product.Code) {
          console.warn(`⚠️ Skipped product without Code: ${product.Name}`);
          continue;
        }

        const dbProduct = await Product.findOne({
          where: { company_code: product.Code },
        });

        if (dbProduct) {
          dbProduct.categoryId = category.categoryId;
          await dbProduct.save();
          console.log(
            `✅ Updated ${product.Code} → categoryId ${category.categoryId}`
          );
        } else {
          console.warn(
            `⚠️ Product not found in DB: ${product.Name || "Unnamed"} (${
              product.Code
            })`
          );
          notFoundProducts.push({
            name: product.Name || "",
            company_code: product.Code,
            categoryId: category.categoryId,
            brandId: BRAND_ID,
            quantity: 20,
            sellingPrice: product.Price || 0,
            purchasingPrice: product.Price || 0,
            description: "",
            images: product.Image ? [product.Image] : [], // Assuming `Image` is the file name
            productGroup: categoryName,
            product_segment: "", // No segment as per your data structure
          });
        }
      }
    } else {
      console.warn(
        `⚠️ Invalid category structure for category: ${categoryName}`
      );
    }
  }

  return notFoundProducts;
}

assignCategoryIdsToProducts(productData)
  .then(() => {
    // Save not-found products to JSON file
    fs.writeFileSync(
      notFoundFilePath,
      JSON.stringify(notFoundProducts, null, 2)
    );
    console.log("✅ All products processed and not-found list updated!");
  })
  .catch((err) => {
    console.error("❌ Error updating products:", err);
  });
