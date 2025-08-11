const { Sequelize, Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/product");
const ProductMeta = require("../models/productMeta");
const Category = require("../models/category");
const ParentCategory = require("../models/parentCategory");
const Brand = require("../models/brand");
const User = require("../models/users");
const BrandParentCategory = require("../models/brandParentCategory");
const sequelize = require("../config/database");
const rawData = require("./products_updated.json");

const fieldTypeMap = {
  sellingPrice: { fieldType: "number", unit: "INR" },
  purchasingPrice: { fieldType: "number", unit: "INR" },
  company_code: { fieldType: "string", unit: null },
  pcsPerBox: { fieldType: "number", unit: null },
  areaCoveredPerPcs: { fieldType: "number", unit: "sqft" },
  areaCoveredPerBox: { fieldType: "number", unit: "sqft" },
  sizeMM: { fieldType: "string", unit: null },
};

async function createOrGetProductMeta(title, fieldType, unit, transaction) {
  let productMeta = await ProductMeta.findOne({
    where: { title },
    transaction,
  });

  if (!productMeta) {
    productMeta = await ProductMeta.create(
      { title, fieldType, unit },
      { transaction }
    );
    console.log(`Created ProductMeta: ${title} (ID: ${productMeta.id})`);
  } else {
    console.log(`Found ProductMeta: ${title} (ID: ${productMeta.id})`);
  }

  return productMeta.id;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await sequelize.transaction();
    try {
      console.log("✅ Assuming database schema is already set up");

      // Fetch or create user with specific userId
      const userId = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";
      let user = await User.findOne({
        where: { userId },
        transaction,
      });
      if (!user) {
        user = await User.create({ userId, name: "Admin" }, { transaction });
        console.log(`Created User: ID ${user.userId}`);
      } else {
        console.log(`Found User: ID ${user.userId}`);
      }

      for (const item of rawData) {
        const {
          parentcategories,
          id,
          brandParentCategoryId,
          product_code,
          images,
          "pcs per box": pcs_per_box,
          "Area Covered per Pcs": Area_Covered_per_Pcs,
          "Area Covered per Box": Area_Covered_per_Box,
          "Size (mm)": Size_mm,
          "MRP per Box": price,
          "Size (inches/feet)": size_inches_feet,
          "Width ": width,
        } = item;

        // Validate required fields
        if (!parentcategories || !id || !brandParentCategoryId) {
          console.warn(
            `⚠️ Skipping item due to missing required fields: parentcategories=${parentcategories}, id=${id}, brandParentCategoryId=${brandParentCategoryId}, item: ${JSON.stringify(
              item
            )}`
          );
          continue;
        }

        // Handle product_code
        let cleanProductCode = product_code ? product_code.trim() : null;
        if (!cleanProductCode) {
          // Generate a default product_code if null or empty
          cleanProductCode = `TILE-${Size_mm || "UNKNOWN"}-${uuidv4().slice(
            0,
            8
          )}`;
          console.log(
            `Generated product_code: ${cleanProductCode} for item: ${JSON.stringify(
              item
            )}`
          );
        }

        // Check for incomplete data
        if (!width || !size_inches_feet || !price) {
          console.warn(
            `⚠️ Skipping item due to incomplete data: Width=${width}, Size (inches/feet)=${size_inches_feet}, MRP per Box=${price}, product_code: ${cleanProductCode}, item: ${JSON.stringify(
              item
            )}`
          );
          continue;
        }

        // Check for duplicate product_code
        const existingProduct = await Product.findOne({
          where: { product_code: cleanProductCode },
          transaction,
        });
        if (existingProduct) {
          console.warn(
            `⚠️ Skipping item due to duplicate product_code: ${cleanProductCode}, item: ${JSON.stringify(
              item
            )}`
          );
          continue;
        }

        // Derive name and category
        const name = cleanProductCode; // Use product_code as name
        const category = "Tiles"; // Default category
        console.log(
          `Processing item: ${cleanProductCode}, Name: ${name}, Category: ${category}, id: ${id}`
        );

        // Find or create Brand using provided id
        let brand = await Brand.findOne({
          where: { id },
          transaction,
        });
        if (!brand) {
          brand = await Brand.create(
            {
              id,
              name: `Brand-${id.slice(0, 8)}`,
            },
            { transaction }
          );
          console.log(`Created Brand: ${brand.name} (ID: ${brand.id})`);
        } else {
          console.log(`Found Brand: ${brand.name} (ID: ${brand.id})`);
        }

        // Find or create ParentCategory
        let parentCategory = await ParentCategory.findOne({
          where: { parentCategoryId: parentcategories },
          transaction,
        });
        if (!parentCategory) {
          parentCategory = await ParentCategory.create(
            {
              parentCategoryId: parentcategories,
              name: `Parent-${parentcategories.slice(0, 8)}`,
            },
            { transaction }
          );
          console.log(
            `Created ParentCategory: ${parentCategory.name} (ID: ${parentCategory.parentCategoryId})`
          );
        }

        // Find or create Category
        let categoryRecord = await Category.findOne({
          where: { name: category, id: brand.id },
          transaction,
        });
        if (!categoryRecord) {
          categoryRecord = await Category.create(
            { categoryId: uuidv4(), name: category, id: brand.id },
            { transaction }
          );
          console.log(
            `Created Category: ${category} (ID: ${categoryRecord.categoryId})`
          );
        }

        // Find or create BrandParentCategory
        let brandParentCategory = await BrandParentCategory.findOne({
          where: {
            brandParentCategoryId,
            id: brand.id,
            parentCategoryId: parentCategory.parentCategoryId,
          },
          transaction,
        });
        if (!brandParentCategory) {
          brandParentCategory = await BrandParentCategory.create(
            {
              brandParentCategoryId,
              id: brand.id,
              parentCategoryId: parentCategory.parentCategoryId,
            },
            { transaction }
          );
          console.log(
            `Created BrandParentCategory (ID: ${brandParentCategory.brandParentCategoryId})`
          );
        }

        // Build meta
        const meta = {};
        const metaFields = {
          company_code: item.company_code || `BRAND-${cleanProductCode}`,
          sellingPrice: price,
          purchasingPrice: price,
          pcsPerBox: pcs_per_box,
          areaCoveredPerPcs: Area_Covered_per_Pcs,
          areaCoveredPerBox: Area_Covered_per_Box,
          sizeMM: Size_mm,
        };

        for (const [key, value] of Object.entries(metaFields)) {
          if (value !== undefined && value !== null) {
            const { fieldType, unit } = fieldTypeMap[key];
            const metaId = await createOrGetProductMeta(
              key,
              fieldType,
              unit,
              transaction
            );
            meta[metaId] = value;
          }
        }

        const productId = uuidv4();
        const productData = {
          productId,
          name,
          company_code: cleanProductCode,
          product_code,
          description: name,
          quantity: 0,
          discountType: null,
          alert_quantity: 0,
          tax: null,
          images: JSON.stringify(
            images && typeof images === "string" ? [images] : []
          ),
          id: brand.id,
          categoryId: categoryRecord.categoryId,
          brand_parentcategoriesId: brandParentCategory.brandParentCategoryId,
          isFeatured: false,
          userId: user.userId,
          productType: "tiles",
          vendorId: null,
          meta,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log(
          `Attempting to upsert product: ${name} (Code: ${cleanProductCode})`
        );
        await Product.upsert(productData, { transaction });
        console.log(`✅ Product upserted: ${name} (ID: ${productId})`);
      }

      await transaction.commit();
      console.log("✅ Product seeding completed successfully.");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error during product seeding:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await sequelize.transaction();
    try {
      const productCodes = rawData
        .map((item) =>
          item.product_code
            ? item.product_code.trim()
            : `TILE-${item["Size (mm)"] || "UNKNOWN"}-${uuidv4().slice(0, 8)}`
        )
        .filter(Boolean);
      await Product.destroy({
        where: { product_code: { [Op.in]: productCodes } },
        transaction,
      });
      await ProductMeta.destroy({
        where: { title: Object.keys(fieldTypeMap) },
        transaction,
      });
      await transaction.commit();
      console.log("✅ Product seed rollback completed.");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error during rollback:", error);
      throw error;
    }
  },
};
