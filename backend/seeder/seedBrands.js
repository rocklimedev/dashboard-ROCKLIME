const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");
const Brand = require("../models/brand");

const brandData = [
  {
    id: uuidv4(),
    brandSlug: "AS_001",
    brandName: "American Standard",
  },
  {
    id: uuidv4(),
    brandSlug: "GP_002",
    brandName: "Grohe Premium",
  },
  {
    id: uuidv4(),
    brandSlug: "JA_003",
    brandName: "Jayna",
  },
  {
    id: uuidv4(),
    brandSlug: "GB_004",
    brandName: "Grohe Bau",
  },
];

const seedBrands = async () => {
  try {
    await sequelize.sync(); // Ensure the database is synced
    await Brand.bulkCreate(brandData, { ignoreDuplicates: true });
    console.log("Brand data seeded successfully!");
  } catch (error) {
    console.error("Error seeding brands:", error);
  } finally {
    await sequelize.close();
  }
};

seedBrands();
