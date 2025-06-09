const Product = require("../models/product");
const Category = require("../models/category");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const fs = require("fs").promises;

async function checkProductsWithSameNameDifferentCategory() {
  try {
    // Fetch all products
    const products = await Product.findAll({
      attributes: ["productId", "name", "categoryId"],
    });

    // Fetch all categories
    const categories = await Category.findAll({
      attributes: ["categoryId", "name"],
    });
    const categoryNameMap = {};
    categories.forEach((category) => {
      categoryNameMap[category.categoryId] = category.name;
    });

    // Group products by name
    const productGroups = {};
    products.forEach((product) => {
      if (!productGroups[product.name]) {
        productGroups[product.name] = [];
      }
      productGroups[product.name].push({
        productId: product.productId,
        categoryId: product.categoryId || null,
        categoryName: product.categoryId
          ? categoryNameMap[product.categoryId] || "Uncategorized"
          : "Uncategorized",
      });
    });

    // Count products with same name but different categories
    const result = [];
    for (const name in productGroups) {
      const categoryIds = [
        ...new Set(productGroups[name].map((p) => p.categoryId)),
      ].filter((id) => id !== null);
      if (categoryIds.length > 1) {
        result.push({
          name,
          productCount: productGroups[name].length,
          categoryCount: categoryIds.length,
          categories: categoryIds.map((id) => ({
            categoryId: id,
            categoryName: categoryNameMap[id] || "Uncategorized",
          })),
          productIds: productGroups[name].map((p) => p.productId),
        });
      }
    }

    if (result.length === 0) {
      return "No products found with the same name but different categories.";
    }

    return result.map((item) => ({
      name: item.name,
      productCount: item.productCount,
      categoryCount: item.categoryCount,
      categories: item.categories,
      productIds: item.productIds,
    }));
  } catch (error) {
    console.error("Error checking products:", error);
    throw error;
  }
}

function formatResultForText(result) {
  if (typeof result === "string") {
    return result;
  }

  let text = `Report generated on ${new Date().toLocaleString()}:\n\n`;
  result.forEach((item, index) => {
    text += `Product ${index + 1}:\n`;
    text += `  Name: ${item.name}\n`;
    text += `  Total Products: ${item.productCount}\n`;
    text += `  Number of Categories: ${item.categoryCount}\n`;
    text += `  Product IDs:\n`;
    item.productIds.forEach((id, idIndex) => {
      text += `    ${idIndex + 1}. ${id}\n`;
    });
    text += `  Categories:\n`;
    item.categories.forEach((category, catIndex) => {
      text += `    ${catIndex + 1}. ID: ${category.categoryId}, Name: ${
        category.categoryName
      }\n`;
    });
    text += "\n";
  });
  return text;
}

async function saveProductsToFile(filePath = "file.txt") {
  try {
    const result = await checkProductsWithSameNameDifferentCategory();
    console.log(JSON.stringify(result, null, 2));

    const formattedText = formatResultForText(result);
    await fs.writeFile(filePath, formattedText, "utf8");
    console.log(`Results successfully saved to ${filePath}`);
  } catch (error) {
    console.error("Error saving products to file:", error);
    throw error;
  }
}

saveProductsToFile();
