const { v4: uuidv4 } = require("uuid");
const BrandParentCategory = require("../models/brandParentCategory");
const Product = require("../models/product");

// JSON data to seed
const jsonData = require("./product.json");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      for (const item of jsonData) {
        if (!item.productId) {
          console.warn(
            `Skipping product with missing productId: ${
              item.name || "Unnamed Product"
            }`
          );
          continue;
        }

        if (!item.product_code) {
          console.warn(
            `Skipping product with missing product_code: ${
              item.name || "Unnamed Product"
            }`
          );
          continue;
        }

        // Step 1: Ensure parent category
        let parentCategory = await BrandParentCategory.findOne({
          where: { id: item.brand_parentcategoriesId },
        });

        if (!parentCategory && item.brand_parentcategoriesId) {
          parentCategory = await BrandParentCategory.create({
            id: item.brand_parentcategoriesId,
            name: item.brand_parentcategoriesId || "Default Parent Category",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Step 2: Prepare product data
        const productData = {
          productId: item.productId,
          name: item.name || "Unnamed Product",
          product_code: String(item.product_code),
          quantity: item.quantity !== undefined ? item.quantity : 0,
          discountType: item.discountType || null,
          alert_quantity:
            item.alert_quantity !== undefined ? item.alert_quantity : 0,
          tax: item.tax || null,
          description: item.description || item.name || "No description",
          images: item.images || JSON.stringify([]),
          isFeatured: item.isFeatured || false,
          userId: item.userId || null,
          productType: item.productType || "tiles",
          brandId: item.brandId || null,
          categoryId: item.categoryId || null,
          vendorId: item.vendorId || null,
          brand_parentcategoriesId: item.brand_parentcategoriesId || null,
          meta: item.meta || {},
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: new Date(),
        };

        // Step 3: Find product by productId
        const existingProduct = await Product.findOne({
          where: { productId: productData.productId },
        });

        if (existingProduct) {
          // 🔄 Update record
          await existingProduct.update(productData);
          console.log(
            `Updated product: ${productData.name} (${productData.product_code})`
          );
        } else {
          // ➕ Create new record
          await Product.create(productData);
          console.log(
            `Created product: ${productData.name} (${productData.product_code})`
          );
        }
      }

      console.log("Products seeded/updated successfully!");
    } catch (error) {
      console.error("Error seeding products:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const productIds = jsonData
      .map((item) => item.productId)
      .filter((id) => id);
    await queryInterface.bulkDelete("products", { productId: productIds }, {});
    console.log("Seeded products removed!");
  },
};
