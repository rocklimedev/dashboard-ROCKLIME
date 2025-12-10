const { v4: uuidv4 } = require("uuid");
const Category = require("../models/category");
const sequelize = require("../config/database");
const categories = require("../categories.json");

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await sequelize.sync();

      for (const category of categories) {
        await Category.findOrCreate({
          where: {
            name: category.name,
            brandId: category.brandId,
          },
          defaults: {
            ...category,
            categoryId: uuidv4(), // ✅ Generate UUID here
          },
        });
      }

      console.log("✅ Categories seeded allowing duplicate names per brandId");
    } catch (err) {
      console.error("❌ Failed to seed categories:", err);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // ⚠️ You no longer have categoryId in your JSON,
      // so we must delete using name + brandId combo
      for (const category of categories) {
        await Category.destroy({
          where: {
            name: category.name,
            brandId: category.brandId,
          },
        });
      }

      console.log("✅ Categories removed");
    } catch (err) {
      console.error("❌ Failed to remove categories:", err);
    }
  },
};
