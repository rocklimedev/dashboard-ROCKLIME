const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");
const { Product } = require("../models");

async function backupProducts() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected using Sequelize");

    const products = await Product.findAll(); // 👈 no filter = all products

    const productsData = products.map((product) => product.toJSON());

    const backupDir = path.join(__dirname, "backup");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `products_backup_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;

    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(productsData, null, 2), "utf8");

    console.log(`✅ Backed up ${productsData.length} products to ${filePath}`);
  } catch (err) {
    console.error("❌ Error during backup:", err);
  } finally {
    await sequelize.close();
  }
}

backupProducts();
