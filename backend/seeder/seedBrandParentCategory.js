// seeders/seedBrandParentCategories.js
require("dotenv").config();
const sequelize = require("../config/database");

const ParentCategory = require("../models/parentCategory");
const BrandParentCategory = require("../models/brandParentCategory");
const BrandParentCategoryBrand = require("../models/brandParentCategoryBrand");
const Brand = require("../models/brand");

const { v4: uuidv4 } = require("uuid");

const seedData = [
  {
    parentCategoryName: "CP Fitting",
    parentCategorySlug: "cp_fitting",
    brands: [
      { name: "American Standard", id: "4e3acf32-1e47-4d38-a6bb-417addd52ac0" },
      { name: "Grohe Kitchen", id: "1a76fdf5-a380-4a62-867c-ca32f6bd7f29" },
      { name: "Grohe Bau", id: "34e5ad50-2d39-4dfe-8726-cb4db364d84d" },
      { name: "Grohe Premium", id: "13847c2c-3c91-4bb2-a130-f94928658237" },
      { name: "Grohe Colour", id: "d642a7f4-9bb9-4d91-bcf3-fd63b438b85e" },
    ],
  },
  {
    parentCategoryName: "Wellness",
    parentCategorySlug: "wellness",
    brands: [{ name: "Colston", id: "acbe7061-9b76-47d1-a509-e4b1f982a36f" }],
  },
  {
    parentCategoryName: "Adhesive",
    parentCategorySlug: "adhesive",
    brands: [],
  },
  {
    parentCategoryName: "Surface",
    parentCategorySlug: "surface",
    brands: [],
  },
];

const seedBrandParentCategories = async () => {
  let trx;
  try {
    await sequelize.authenticate();
    console.log("✓ DB connected...");

    for (const item of seedData) {
      trx = await sequelize.transaction();

      // 1) Ensure ParentCategory
      const [parentCategory, createdPC] = await ParentCategory.findOrCreate({
        where: { name: item.parentCategoryName },
        defaults: {
          id: uuidv4(),
          name: item.parentCategoryName,
          slug: item.parentCategorySlug,
        },
        transaction: trx,
      });

      console.log(
        `${createdPC ? "➕ Created" : "✔ Exists"} ParentCategory: ${
          item.parentCategoryName
        }`
      );

      // 2) Ensure BrandParentCategory (entity with its own id/name/slug)
      const [bpc, createdBPC] = await BrandParentCategory.findOrCreate({
        where: { slug: item.parentCategorySlug },
        defaults: {
          id: uuidv4(),
          name: item.parentCategoryName,
          slug: item.parentCategorySlug,
        },
        transaction: trx,
      });

      console.log(
        `${createdBPC ? "➕ Created" : "✔ Exists"} BrandParentCategory: ${
          bpc.name
        }`
      );

      // 3) If ParentCategory has the FK column, set it
      if ("brandParentCategoryId" in ParentCategory.rawAttributes) {
        if (parentCategory.brandParentCategoryId !== bpc.id) {
          await parentCategory.update(
            { brandParentCategoryId: bpc.id },
            { transaction: trx }
          );
          console.log(
            `🔗 Set ParentCategory.brandParentCategoryId → ${bpc.id} (${bpc.slug})`
          );
        } else {
          console.log("✔ ParentCategory already linked to BrandParentCategory");
        }
      } else {
        console.log(
          "ℹ ParentCategory model has no brandParentCategoryId column; skipping FK set."
        );
      }

      // 4) Link each Brand to this BrandParentCategory via pivot
      for (const brand of item.brands) {
        const brandExists = await Brand.findByPk(brand.id, {
          transaction: trx,
        });
        if (!brandExists) {
          console.warn(`⚠️ Brand not found: ${brand.name} (${brand.id})`);
          continue;
        }

        // Use findOrCreate on the pivot
        const [pivotRow, createdPivot] =
          await BrandParentCategoryBrand.findOrCreate({
            where: {
              brandParentCategoryId: bpc.id,
              brandId: brand.id,
            },
            defaults: {
              brandParentCategoryId: bpc.id,
              brandId: brand.id,
            },
            transaction: trx,
          });

        console.log(
          `${createdPivot ? "🔗 Linked" : "✔ Link exists"} Brand: ${
            brand.name
          } → BrandParentCategory: ${bpc.name}`
        );
      }

      await trx.commit();
      trx = null;
    }

    console.log("✅ Seeding complete!");
    process.exit(0);
  } catch (err) {
    if (trx) {
      try {
        await trx.rollback();
      } catch (_) {}
    }
    console.error("❌ Error seeding BrandParentCategories:", err);
    process.exit(1);
  }
};

seedBrandParentCategories();
