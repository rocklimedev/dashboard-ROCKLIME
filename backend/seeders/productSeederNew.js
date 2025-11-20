const { v4: uuidv4 } = require("uuid");
const BrandParentCategory = require("../models/brandParentCategory");
const Product = require("../models/product");

// JSON data
const jsonData = require("./error.json");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      for (const item of jsonData) {
        // Validate required fields
        if (!item.name) {
          console.warn(`Skipping product with missing name`);
          continue;
        }

        // Generate productId if missing
        const productId = item.productId || uuidv4();

        // Ensure parent category exists
        let parentCategory = null;

        if (item.brand_parentcategoriesId) {
          parentCategory = await BrandParentCategory.findOne({
            where: { id: item.brand_parentcategoriesId },
          });

          if (!parentCategory) {
            parentCategory = await BrandParentCategory.create({
              id: item.brand_parentcategoriesId,
              name: item.parentCategoryName || "Default Parent Category",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Build meta object
        const meta = {
          companyCode: item.company_code || null,
          sellingPrice: item.selling_price || null,
        };

        // Prepare product payload
        const productData = {
          productId,
          name: item.name,
          product_code: String(item.company_code),
          quantity: item.quantity ?? 0,
          discountType: item.discountType || null,
          alert_quantity: item.alert_quantity ?? 0,
          tax: item.tax || null,
          description: item.description || item.name,
          images: item.images || JSON.stringify([]),
          isFeatured: item.isFeatured || false,
          userId: item.userId || null,

          brandId: item.brandId || null,
          categoryId: item.categoryId || null,
          vendorId: item.vendorId || null,
          brand_parentcategoriesId: item.brand_parentcategoriesId || null,

          meta,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: new Date(),
        };

        // Check if product exists
        const existing = await Product.findOne({
          where: { productId },
        });

        if (existing) {
          await existing.update(productData);
          console.log(`Updated product: ${item.name} (${item.company_code})`);
        } else {
          await Product.create(productData);
          console.log(`Created product: ${item.name} (${item.company_code})`);
        }
      }

      console.log("Products seeded/updated successfully!");
    } catch (error) {
      console.error("Error seeding products:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const productIds = jsonData.map((i) => i.productId).filter(Boolean);
    await queryInterface.bulkDelete("products", { productId: productIds }, {});
    console.log("Seeded products removed!");
  },
};
