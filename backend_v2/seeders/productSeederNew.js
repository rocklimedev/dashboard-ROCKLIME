const { v4: uuidv4 } = require("uuid");
const BrandParentCategory = require("../models/brandParentCategory");
const Product = require("../models/product");
const jsonData = require("./updated.json");

const getProductCode = (item) => {
  if (
    item.product_code &&
    item.product_code !== "undefined" &&
    item.product_code !== "null"
  ) {
    return item.product_code;
  }

  // This is where your real product code lives!
  const metaCode = item.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"];
  if (metaCode) {
    return `EGR${metaCode}`; // GR28912000
  }

  // Final fallback
  return `EGR${Date.now()}${Math.random()
    .toString(36)
    .substr(2, 5)}`.toUpperCase();
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      for (const item of jsonData) {
        if (!item.name) {
          console.warn("Skipping product with missing name");
          continue;
        }

        const productId = item.productId || uuidv4();

        // Ensure parent category exists
        if (item.brand_parentcategoriesId) {
          const exists = await BrandParentCategory.findByPk(
            item.brand_parentcategoriesId
          );
          if (!exists) {
            await BrandParentCategory.create({
              id: item.brand_parentcategoriesId,
              name: item.parentCategoryName || "Auto Created Category",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        const productData = {
          productId,
          name: item.name.trim(),
          product_code: getProductCode(item),
          quantity: Number(item.quantity) || 0,
          discountType: item.discountType || "percent",
          alert_quantity: Number(item.alert_quantity) || 10,
          tax: item.tax ? String(item.tax) : "18.00",
          description: item.description || item.name,
          images:
            typeof item.images === "string"
              ? item.images
              : JSON.stringify(item.images || []),
          isFeatured: Boolean(item.isFeatured),
          status: item.status || "active",

          brandId: item.brandId || null,
          categoryId: item.categoryId || null,
          vendorId: item.vendorId || null,
          brand_parentcategoriesId: item.brand_parentcategoriesId || null,

          meta: {
            companyCode:
              item.meta?.["d11da9f9-3f2e-4536-8236-9671200cca4a"] || null,
            sellingPrice:
              item.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"] || null,
          },

          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // CORRECT FOR SEQUELIZE V6
        const [product, wasCreated] = await Product.upsert(productData, {
          returning: true, // This is the key!
        });

        console.log(
          wasCreated
            ? `Created: ${product.name} → ${product.product_code}`
            : `Updated: ${product.name} → ${product.product_code}`
        );
      }

      console.log("All products seeded successfully!");
    } catch (error) {
      console.error("Error seeding products:", error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const ids = jsonData.map((i) => i.productId).filter(Boolean);
    if (ids.length > 0) {
      await queryInterface.bulkDelete("products", { productId: ids });
    }
  },
};
