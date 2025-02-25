const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/product"); // Adjust this path as per your project structure
const sequelize = require("../config/database");

async function seedProducts() {
  try {
    // Read the JSON file
    const dataPath = path.join(__dirname, "../dummy.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const products = JSON.parse(rawData);

    // Transform the data to match the database schema
    const productData = products.map((product) => {
      let brandId = (product["Brand_Slug"] || "").trim(); // Ensure it's a valid string

      if (brandId.length !== 36) {
        console.error(`Invalid brandId length: ${brandId}`);
        brandId = null; // Set to NULL if invalid
      }

      return {
        productId: uuidv4(),
        itemType: product["Product Segment"],
        productGroup: product["Product group"],
        name: product["Product Description"],
        sku: product["Product Code"],
        sellingPrice: parseFloat(product["MRP"].toString().replace(/[^0-9.]/g, "")), // Handle ₹ and other symbols
        purchasingPrice: parseFloat(product["MRP"].toString().replace(/[^0-9.]/g, "")) * 0.8, // Assume 80% of MRP as purchase price
        quantity: 100, // Default quantity
        discountType: "percent",
        barcode: uuidv4(),
        alert_quantity: 10, // Default alert quantity
        tax: 18.00, // Default tax percentage
        description: product["Product Description"],
        images: JSON.stringify([]), // Default empty image array
        brandId: brandId, // Use the sanitized brandId
        categoryId: product["Category_Id"],
      };
    });

    // Insert into the database
    await sequelize.sync(); // Ensure the DB is in sync
    await Product.bulkCreate(productData);
    console.log("Product seeding successful!");
  } catch (error) {
    console.error("Error seeding products:", error);
  } finally {
    await sequelize.close();
  }
}

seedProducts();
