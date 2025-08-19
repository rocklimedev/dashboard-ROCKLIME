const { Sequelize, Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/product");
const User = require("../models/users");
const sequelize = require("../config/database");
const rawData = require("./product.json");

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await sequelize.transaction();
    try {
      console.log("✅ Starting Adhesive Product Seeding...");

      // Ensure user exists
      const userId = "2ef0f07a-a275-4fe1-832d-fe9a5d145f60";
      let user = await User.findOne({ where: { userId }, transaction });
      if (!user) {
        user = await User.create({ userId, name: "Admin" }, { transaction });
        console.log(`Created User: ${userId}`);
      }

      for (const item of rawData) {
        let {
          name,
          company_code,
          description,
          images,
          brandId,
          categoryId,
          isFeatured,
          userId: itemUserId,
          productType,
          vendorId,
          brand_parentcategoriesId,
          meta,
          productCode,
        } = item;

        // 🔥 Fix ENUM mismatch
        if (!["tiles", "sanitary"].includes(productType)) {
          console.warn(
            `⚠️ productType "${productType}" is invalid. Defaulting to "tiles".`
          );
          productType = "tiles";
        }

        // 🔥 Fix images for JSON column
        const imagesArray =
          images && typeof images === "string" ? [images] : [];

        const productData = {
          productId: uuidv4(),
          name,
          company_code,
          product_code: productCode,
          description,
          quantity: item.quantity ?? 0,
          discountType: item.discountType ?? null,
          alert_quantity: item.alert_quantity ?? 20,
          tax: item.tax ?? null,
          images: imagesArray, // ✅ keep JSON array, not string
          brandId,
          categoryId,
          brand_parentcategoriesId,
          isFeatured: isFeatured ?? 0, // ✅ keep as int (0/1)
          userId: itemUserId || user.userId,
          productType,
          vendorId,
          meta,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        };

        console.log(`Upserting product: ${productData.product_code}`);
        await Product.upsert(productData, { transaction });
      }

      await transaction.commit();
      console.log("✅ Adhesive Product Seeding Completed.");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error during adhesive seeding:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await sequelize.transaction();
    try {
      const productCodes = rawData
        .map((item) => item.productCode)
        .filter(Boolean);

      await Product.destroy({
        where: { product_code: { [Op.in]: productCodes } },
        transaction,
      });

      await transaction.commit();
      console.log("✅ Adhesive Product Rollback Completed.");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error during rollback:", error);
      throw error;
    }
  },
};
