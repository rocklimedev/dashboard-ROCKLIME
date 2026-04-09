"use strict";

const fs = require("fs");
const path = require("path");
const { v7: uuidv7 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("🚀 Starting products and inventory seeder...");

      // 📂 Read JSON files
      const productsPath = path.join(__dirname, "./updated-stock.json");
      const inventoryPath = path.join(__dirname, "./inventory-history.json");

      const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
      const inventoryHistory = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));

      console.log(`📦 Found ${products.length} products and ${inventoryHistory.length} inventory records`);

      // ✅ Prepare Products
      const formattedProducts = products.map((p) => ({
        productId: p.productId,
        name: p.name,
        product_code: p.product_code,
        quantity: p.quantity || 0,
        discountType: p.discountType || null,
        alert_quantity: p.alert_quantity || null,
        tax: p.tax || null,
        description: p.description || null,

        images: p.images ? JSON.stringify(p.images) : null,
        meta: p.meta ? JSON.stringify(p.meta) : null,
        variantOptions: p.variantOptions ? JSON.stringify(p.variantOptions) : null,

        variantKey: p.variantKey || null,
        skuSuffix: p.skuSuffix || null,

        brandId: p.brandId || null,
        categoryId: p.categoryId || null,
        vendorId: p.vendorId || null,
        brand_parentcategoriesId: p.brand_parentcategoriesId || null,

        isFeatured: p.isFeatured === "1" || p.isFeatured === 1 || p.isFeatured === true,
        isMaster: p.isMaster === "1" || p.isMaster === 1 || p.isMaster === true,

        masterProductId: p.masterProductId || null,

        status: p.status || "active",

        createdAt: new Date(p.createdAt || Date.now()),
        updatedAt: new Date(p.updatedAt || Date.now()),
      }));

      // ✅ Insert or Update Products
      console.log("📥 Inserting / Updating products...");
      await queryInterface.bulkInsert("products", formattedProducts, {
        updateOnDuplicate: [
          "name",
          "product_code",
          "quantity",
          "discountType",
          "alert_quantity",
          "tax",
          "description",
          "images",
          "meta",
          "variantOptions",
          "variantKey",
          "skuSuffix",
          "brandId",
          "categoryId",
          "vendorId",
          "brand_parentcategoriesId",
          "isFeatured",
          "isMaster",
          "masterProductId",
          "status",
          "updatedAt"
        ],
      });

      // ✅ Prepare Inventory History (append only)
      const formattedInventory = inventoryHistory
        .filter((item) => item.productId)
        .map((item) => ({
          id: uuidv7(),
          productId: item.productId,
          change: item.change || 0,
          quantityAfter: item.quantityAfter || 0,
          action: item.action || "adjustment",
          orderNo: item.orderNo || null,
          userId: item.userId || null,
          message: item.message || null,
          createdAt: new Date(item.createdAt || Date.now()),
          updatedAt: new Date(item.updatedAt || Date.now()),
        }));

      // ✅ Insert Inventory History without deleting old records
      console.log("📥 Appending inventory history...");
      await queryInterface.bulkInsert("inventory_history", formattedInventory, {
        ignoreDuplicates: true, // ensure UUID uniqueness safety
      });

      console.log("✅ Seeder completed successfully!");
      console.log(`   → ${formattedProducts.length} products inserted/updated`);
      console.log(`   → ${formattedInventory.length} inventory records appended`);

    } catch (error) {
      console.error("❌ Seeder Error:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Rolling back products and inventory seeder...");
    // Do NOT delete inventory_history or products
    console.log("✅ Rollback skipped (nothing deleted)");
  },
};