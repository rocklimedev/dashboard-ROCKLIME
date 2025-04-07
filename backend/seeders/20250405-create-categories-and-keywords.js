"use strict";

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Category = require("../models/category");
const Keyword = require("../models/keyword");

module.exports = {
  up: async () => {
    const rawData = fs.readFileSync(
      path.join(__dirname, "../utils/json-outputs/GROHE PREMIUM.json")
    );
    const jsonData = JSON.parse(rawData);

    const existingParentCategoryId = "80afdfa6-2124-4c58-8d1e-116f9f7d8c56"; // Replace with actual UUID

    for (const [mainCategoryName, keywordBlockArray] of Object.entries(
      jsonData
    )) {
      let categoryId;
      try {
        // Check if the category already exists
        const existingCategory = await Category.findOne({
          where: { name: mainCategoryName },
        });

        if (existingCategory) {
          categoryId = existingCategory.categoryId;

          // If it doesn't have parentCategoryId, update it
          if (!existingCategory.parentCategoryId) {
            await existingCategory.update({
              parentCategoryId: existingParentCategoryId,
              parentCategory: true,
            });
            console.log(
              `✅ Updated existing category "${mainCategoryName}" with parentCategoryId`
            );
          } else {
            console.log(
              `🔁 Category "${mainCategoryName}" already exists with parentCategoryId`
            );
          }
        } else {
          // Create new category
          categoryId = uuidv4();
          await Category.create({
            categoryId,
            name: mainCategoryName,
            parentCategory: true,
            parentCategoryId: existingParentCategoryId,
          });
          console.log(`✅ Created new category "${mainCategoryName}"`);
        }
      } catch (error) {
        console.error(
          `❌ Error handling category "${mainCategoryName}":`,
          error.message
        );
        continue;
      }

      // Always insert new keyword even if name is same
      const keywordBlock = keywordBlockArray[0];
      for (const [keyword, _products] of Object.entries(keywordBlock)) {
        try {
          await Keyword.create({
            id: uuidv4(),
            keyword,
            categoryId,
          });
          console.log(`➕ Added keyword "${keyword}" to "${mainCategoryName}"`);
        } catch (error) {
          console.error(
            `❌ Failed to create keyword "${keyword}":`,
            error.message
          );
        }
      }
    }
  },

  down: async () => {
    await Keyword.destroy({ where: {} });
    await Category.destroy({ where: {} });
  },
};
