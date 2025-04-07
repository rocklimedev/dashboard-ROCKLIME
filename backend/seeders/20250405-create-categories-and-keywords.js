"use strict";

const fs = require("fs");
const path = require("path");

module.exports = {
  async up(queryInterface, Sequelize) {
    const filePath = path.resolve(
      __dirname,
      "../utils/json-outputs/American Standard.json"
    );
    const rawData = fs.readFileSync(filePath);
    const categories = JSON.parse(rawData);

    for (const category of categories) {
      const [createdCategory] = await queryInterface.bulkInsert(
        "categories",
        [
          {
            name: category.category,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { returning: true }
      );

      const keywordRecords = category.keywords.map((keyword) => ({
        name: keyword,
        categoryId: createdCategory.id, // assumes foreign key
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await queryInterface.bulkInsert("keywords", keywordRecords);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("keywords", null, {});
    await queryInterface.bulkDelete("categories", null, {});
  },
};
