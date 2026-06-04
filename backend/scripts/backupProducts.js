const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");
const { Product } = require("../models");

const GROHE_BRANDS = [
  "13847c2c-3c91-4bb2-a130-f94928658237", // Grohe Premium
  "d642a7f4-9bb9-4d91-bcf3-fd63b438b85e", // Grohe Bau
  "39fd411d-7c06-11f0-9e84-52540021303b",
];

async function backupGroheProducts() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected using Sequelize");

    const products = await Product.findAll({
      where: {
        brandId: GROHE_BRANDS,
      },
    });

    const productsData = products.map((product) => product.toJSON());

    const backupDir = path.join(__dirname, "backup");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `grohe_products_backup_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;

    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(productsData, null, 2), "utf8");

    console.log(
      `✅ Backed up ${productsData.length} Grohe products to ${filePath}`,
    );
  } catch (err) {
    console.error("❌ Error during Grohe backup:", err);
  } finally {
    await sequelize.close();
  }
}

backupGroheProducts();
