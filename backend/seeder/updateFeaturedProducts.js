const sequelize = require("../config/database");
const Product = require("../models/product");

const companyCodesToUpdate = [
  "CCAS3131-3W20400F0",
  "CCASC131-U200410F0",
  "1013962080",
  "CCASC162-0200410F0",
  "CCAS1862-1320411A0",
  "39328I0H",
  "39330002",
  "CCASF650-1000410F0",
  "CCASF605-0000410F0",
  "FFAS1304-102500BF0",
  "20289001",
  "24254001",
  "29375001",
  "29062001",
  "24080000",
  "29146000",
  "3898700I",
  "38732000",
  "FFAS4956-601500BC0",
];

async function updateFeaturedProducts() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    const [updatedCount] = await Product.update(
      { isFeatured: true },
      {
        where: {
          company_code: companyCodesToUpdate,
          isFeatured: false,
        },
      }
    );

    console.log(`✅ Updated ${updatedCount} product(s) to featured.`);
  } catch (error) {
    console.error("❌ Error updating products:", error.message);
  } finally {
    await sequelize.close();
  }
}

updateFeaturedProducts();
