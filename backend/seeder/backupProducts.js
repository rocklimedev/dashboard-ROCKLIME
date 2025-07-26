const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");
const Product = require("../models/product"); // adjust the path to your model

async function backupProducts() {
  try {
    // Authenticate Sequelize connection
    await sequelize.authenticate();
    console.log("✅ Database connected using Sequelize");

    // Fetch all product records
    const products = await Product.findAll();

    // Convert Sequelize instances to plain JS objects
    const productsData = products.map((product) => product.toJSON());

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, "backup");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Generate timestamped filename
    const fileName = `products_backup_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;

    const filePath = path.join(backupDir, fileName);

    // Write to JSON file
    fs.writeFileSync(filePath, JSON.stringify(productsData, null, 2), "utf-8");

    console.log(`✅ Backup successful! File created at: ${filePath}`);
  } catch (err) {
    console.error("❌ Error during product backup:", err.message);
  } finally {
    await sequelize.close();
  }
}

backupProducts();
