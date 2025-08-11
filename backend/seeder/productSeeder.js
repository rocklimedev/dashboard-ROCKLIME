const { Sequelize, Op } = require("sequelize");
const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const Category = require("../models/category"); // Child category
const ParentCategory = require("../models/parentCategory"); // Top-level
const sequelize = require("../config/database");

const slugify = require("slugify");
const rawData = require("./backup/products_backup_2025-08-05T05-36-53-955Z.json");

const fieldTypeMap = {
  sellingPrice: { fieldType: "number", unit: "INR" },
  purchasingPrice: { fieldType: "number", unit: "INR" },
  company_code: { fieldType: "string", unit: null },
};

// ✅ CREATE OR FETCH PARENT CATEGORY
async function createOrGetParentCategory(name) {
  const slug = slugify(name, { lower: true });

  let parent = await ParentCategory.findOne({ where: { slug } });

  if (!parent) {
    parent = await ParentCategory.create({
      name,
      slug,
    });
  }

  return parent.id;
}

// ✅ CREATE OR FETCH CHILD CATEGORY UNDER PARENT
async function createOrGetCategory(name, parentCategoryId) {
  let category = await Category.findOne({
    where: {
      name,
      parentCategoryId,
    },
  });

  if (!category) {
    category = await Category.create({
      name,
      parentCategoryId,
    });
  }

  return category.id;
}

// ✅ PRODUCT META CREATOR
async function createOrGetProductMeta(title, fieldType, unit) {
  let productMeta = await ProductMeta.findOne({ where: { title } });

  if (!productMeta) {
    productMeta = await ProductMeta.create({
      title,
      fieldType,
      unit,
    });
  }

  return productMeta.id;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await sequelize.sync();

      let currentParentCategoryId = null;
      let currentCategoryId = null;

      for (const item of rawData) {
        const { parentcategories, row } = item;

        // ✅ Step 1: Ensure ParentCategory exists
        if (!currentParentCategoryId || parentcategories) {
          currentParentCategoryId = await createOrGetParentCategory(
            parentcategories
          );
        }

        // ✅ Step 2: Handle Category row (single item)
        if (row.length === 1 && typeof row[0] === "string") {
          const categoryName = row[0];
          currentCategoryId = await createOrGetCategory(
            categoryName,
            currentParentCategoryId
          );
          continue;
        }

        // ✅ Step 3: Handle Product row (5 elements)
        if (row.length === 5) {
          const [, name, company_code, price, product_code] = row;

          const description = name;
          const productId = Sequelize.DataTypes.UUIDV4();
          const meta = {};

          // Build metadata
          for (const key of [
            "company_code",
            "sellingPrice",
            "purchasingPrice",
          ]) {
            let value;
            if (key === "company_code") value = company_code;
            if (key === "sellingPrice" || key === "purchasingPrice")
              value = price;

            const { fieldType, unit } = fieldTypeMap[key] || {
              fieldType: "string",
              unit: null,
            };
            const metaId = await createOrGetProductMeta(key, fieldType, unit);
            meta[metaId] = value;
          }

          // Final product insert
          const product = {
            productId,
            name,
            product_code,
            description,
            quantity: 0,
            discountType: null,
            alert_quantity: 0,
            tax: null,
            images: JSON.stringify([]),
            brandId: null,
            categoryId: currentCategoryId,
            brand_parentcategoriesId: currentParentCategoryId,
            isFeatured: false,
            userId: null,
            productType: "simple",
            vendorId: null,
            meta,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await Product.upsert(product);
        }
      }

      console.log("✅ Seeding complete with parent & child categories.");
    } catch (error) {
      console.error("❌ Error during seeding:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await Product.destroy({
        where: {
          product_code: {
            [Op.in]: rawData
              .filter((item) => item.row.length === 5)
              .map((item) => item.row[4]),
          },
        },
      });

      console.log("✅ Product seed rollback completed.");
    } catch (error) {
      console.error("❌ Error during rollback:", error);
      throw error;
    }
  },
};
