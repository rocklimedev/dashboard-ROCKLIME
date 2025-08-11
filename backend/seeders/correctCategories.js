// scripts/updateCategoriesFromDB.js
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const Category = require("../models/category");

const BRAND_ID = "acbe7061-9b76-47d1-a509-e4b1f982a36f";
const JSON_FILE_PATH = path.join(__dirname, "../transformed.json");

(async () => {
  try {
    // 1. Fetch categories for the given brandId
    const categories = await Category.findAll({
      where: { brandId: BRAND_ID },
      raw: true,
    });

    // Make a lookup map for quick matching (case-insensitive)
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name.toLowerCase()] = cat;
    });

    // 2. Read JSON file
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8"));

    // 3. Loop through and replace category value
    const updatedData = jsonData.map((item) => {
      const catName = item.category?.toLowerCase();
      if (catName && categoryMap[catName]) {
        // Replace with DB category object or just ID
        return {
          ...item,
          category: categoryMap[catName].categoryId,
        };
      }
      return item;
    });

    // 4. Write updated JSON
    const outputPath = path.join(__dirname, "products_updated.json");
    fs.writeFileSync(outputPath, JSON.stringify(updatedData, null, 2), "utf8");

    console.log(`Updated JSON saved to: ${outputPath}`);

    await sequelize.close();
  } catch (err) {
    console.error("Error:", err);
    await sequelize.close();
    process.exit(1);
  }
})();
