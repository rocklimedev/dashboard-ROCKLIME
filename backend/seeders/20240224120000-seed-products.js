"use strict";
const fs = require("fs");
const path = require("path");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Read JSON file
      const filePath = path.join(__dirname, "../dummy.json");
      const rawData = fs.readFileSync(filePath);
      const products = JSON.parse(rawData);

      // Transform JSON keys to match DB columns
      const productData = products.map((product) => ({
        company_code: product["Company Code"],
        product_description: product["Product Description"],
        product_segment: product["Product Segment"],
        product_group: product["Product group"],
        mrp: product["MRP"],
        brand_slug: product["Brand_Slug"],
        vendor_slug: product["Vendor_Slug"],
        category_name: product["Category_Name"],
        product_code: product["Product Code"],
        company_code_1: product["Company Code_1"],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Insert data into the Products table
      return queryInterface.bulkInsert("Products", productData);
    } catch (error) {
      console.error("Error seeding products:", error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Products", null, {});
  },
};
