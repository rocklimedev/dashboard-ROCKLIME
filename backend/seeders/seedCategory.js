const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");
const Category = require("../models/category");
const ParentCategory = require("../models/parentCategory");

const categoriesData = [
  {
    slug: "C_1",
    name: "Sanitary",
    parentCategory: true,
  },
  {
    slug: "C_2",
    name: "Ceramics",
    parentCategory: true,
  },
  {
    slug: "C_3",
    name: "Kitchen",
    parentCategory: true,
  },
];

const seedCategories = async () => {
  try {
    await sequelize.sync(); // Ensure database sync

    for (const category of categoriesData) {
      const parentCategory = await ParentCategory.findOne({
        where: { name: category.name },
      });

      const parentCategoryId = parentCategory ? parentCategory.id : null;

      await Category.create({
        categoryId: uuidv4(),
        name: category.name,
        total_products: 0,
        vendorId: null, // Set this dynamically if needed
        slug: category.slug,
        parentCategory: category.parentCategory,
        parentCategoryId: parentCategoryId,
      });
    }

    console.log("✅ Categories seeded successfully.");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  }
};

seedCategories();
