const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");
const Vendor = require("../models/vendor");
const Brand = require("../models/brand");

const vendors = [
  {
    vendorId: "V_1",
    vendorName: "Arth Tiles",
    brandSlug: "AS_001",
  },
  {
    vendorId: "V_2",
    vendorName: "S4 Bath",
    brandSlug: "GB_004",
  },
  {
    vendorId: "V_3",
    vendorName: "Groha",
    brandSlug: "GP_002",
  },
  {
    vendorId: "V_4",
    vendorName: "Jayna",
    brandSlug: "JA_003",
  },
];

const seedVendors = async () => {
  try {
    await sequelize.sync(); // Ensure database is synced

    for (const vendor of vendors) {
      const brand = await Brand.findOne({ where: { brandSlug: vendor.brandSlug } });

      if (!brand) {
        console.log(`Brand not found for slug: ${vendor.brandSlug}, skipping...`);
        continue;
      }

      await Vendor.create({
        id: uuidv4(),
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        brandId: brand.id, // Assign the correct brandId
        brandSlug: vendor.brandSlug,
      });
    }

    console.log("Vendors seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("Error seeding vendors:", error);
    process.exit(1);
  }
};

seedVendors();
