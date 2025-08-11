const ParentCategory = require("../models/parentCategory");
const sequelize = require("../config/database");
const { Sequelize, Op } = require("sequelize");
const parentCategories = [
  {
    id: "d2d9627d-674f-4e4d-ade6-1533fa9460f0",
    name: "COLSTON PROJECT",
    slug: "colston-project",
  },
  {
    id: "53d41af3-b078-45aa-b226-bef6a35ce1c8",
    name: "COLSTON WELLNESS",
    slug: "colston-wellness",
  },
  {
    id: "d18dd89c-90d2-44dd-8ba4-16783d58bd5e",
    name: "COLSTON BATHROOM",
    slug: "colston-bathroom",
  },
  {
    id: "7b7a5690-1dae-46dd-9de0-601646b66331",
    name: "COLSTON WATER INNOVATION",
    slug: "colston-water-innovation",
  },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await sequelize.sync();
      await ParentCategory.bulkCreate(parentCategories, {
        ignoreDuplicates: true,
      });
      console.log("✅ Parent categories seeded");
    } catch (err) {
      console.error("❌ Failed to seed parent categories:", err);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await ParentCategory.destroy({
        where: {
          id: parentCategories.map((item) => item.id),
        },
      });
      console.log("✅ Parent categories removed");
    } catch (err) {
      console.error("❌ Failed to remove parent categories:", err);
    }
  },
};
