const { Sequelize } = require("sequelize");
const Product = require("../models/product");
const sequelize = require("../config/database");
const newProducts = require("../transformed_products.json");

async function updateProducts() {
  const transaction = await sequelize.transaction();
  try {
    const results = await Promise.all(
      newProducts.map(async (prod) => {
        const [affectedCount] = await Product.update(
          {
            name: prod.name,
            description: prod.description,
            images: prod.images,
            brandId: prod.brandId,
            brand_parentcategoriesId: prod.brand_parentcategoriesId,
            parentcategoriesId: prod.parentcategoriesId,
            categoryId: prod.categoryId,
            isFeatured: prod.isFeatured,
            userId: prod.userId,
            productType: prod.productType,
            vendorId: prod.vendorId,
            meta: prod.meta,
            quantity: prod.quantity,
            alert_quantity: prod.alert_quantity,
          },
          {
            where: { product_code: prod.product_code },
            transaction,
          }
        );

        return { code: prod.product_code, updated: affectedCount > 0 };
      })
    );

    await transaction.commit();

    const updated = results.filter((r) => r.updated).length;
    const skipped = results.length - updated;
    console.log(`✅ Updated: ${updated}, ⚠️ Skipped (not found): ${skipped}`);
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Update failed:", error);
  }
}

updateProducts();
