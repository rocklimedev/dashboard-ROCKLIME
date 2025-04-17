const Category = require("../models/category");
const Keyword = require("../models/keyword");
const Product = require("../models/product");
const productData = require("./json-outputs/American Standard.json"); // your JSON file

async function assignCategoryIdsToProducts() {
  for (const [categoryName, keywordGroups] of Object.entries(productData)) {
    for (const keywordGroup of keywordGroups) {
      for (const [keywordName, products] of Object.entries(keywordGroup)) {
        // Get the keyword with its category context
        const category = await Category.findOne({
          where: { name: categoryName },
        });
        if (!category) continue;

        const keyword = await Keyword.findOne({
          where: {
            keyword: keywordName,
            categoryId: category.categoryId,
          },
        });
        if (!keyword) continue;

        for (const product of products) {
          const dbProduct = await Product.findOne({
            where: { company_code: product.Code },
          });

          if (dbProduct) {
            dbProduct.categoryId = keyword.categoryId;
            await dbProduct.save();
            console.log(
              `Updated ${product.Name} with categoryId ${keyword.categoryId}`
            );
          } else {
            console.log(`Product with code ${product.Code} not found in DB`);
          }
        }
      }
    }
  }
}

assignCategoryIdsToProducts()
  .then(() => {
    console.log("All products updated successfully!");
  })
  .catch((err) => {
    console.error("Error updating products:", err);
  });
