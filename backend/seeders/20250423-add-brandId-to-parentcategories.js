// utils/addBrandIdToParentCategories.js
const sequelize = require("../config/database");
const { QueryTypes } = require("sequelize");

async function addBrandIdToParentCategories() {
  try {
    // Start a transaction to ensure atomicity
    await sequelize.transaction(async (transaction) => {
      // Step 1: Add brandId column as nullable
      await sequelize.getQueryInterface().addColumn(
        "parentcategories",
        "brandId",
        {
          type: sequelize.Sequelize.UUID,
          allowNull: true,
        },
        { transaction }
      );
      console.log("Added brandId column as nullable.");

      // Step 2: Update existing parentcategories rows with valid brandId
      await sequelize.query(
        `
        UPDATE parentcategories pc
        SET pc.brandId = CASE pc.name
          WHEN 'Grohe Kitchen' THEN '13847c2c-3c91-4bb2-a130-f94928658237'
          WHEN 'American Standard' THEN '4e3acf32-1e47-4d38-a6bb-417addd52ac0'
          WHEN 'Grohe Bau' THEN 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e'
          WHEN 'Grohe Colour' THEN '13847c2c-3c91-4bb2-a130-f94928658237'
          WHEN 'Grohe Premium' THEN '13847c2c-3c91-4bb2-a130-f94928658237'
          ELSE '13847c2c-3c91-4bb2-a130-f94928658237'
        END;
      `,
        { transaction }
      );
      console.log("Updated parentcategories with brandId values.");

      // Step 3: Verify no NULL brandId values remain
      const nullRows = await sequelize.query(
        `SELECT id, name FROM parentcategories WHERE brandId IS NULL`,
        { type: QueryTypes.SELECT, transaction }
      );
      if (nullRows.length > 0) {
        throw new Error(
          `Found ${nullRows.length} rows with NULL brandId: ${JSON.stringify(
            nullRows
          )}`
        );
      }
      console.log("Verified no NULL brandId values.");

      // Step 4: Verify all brandId values exist in brands
      const invalidRows = await sequelize.query(
        `SELECT pc.id, pc.name, pc.brandId
         FROM parentcategories pc
         LEFT JOIN brands b ON pc.brandId = b.id
         WHERE b.id IS NULL`,
        { type: QueryTypes.SELECT, transaction }
      );
      if (invalidRows.length > 0) {
        throw new Error(
          `Found ${
            invalidRows.length
          } rows with invalid brandId: ${JSON.stringify(invalidRows)}`
        );
      }
      console.log("Verified all brandId values exist in brands.");

      // Step 5: Make brandId NOT NULL and add foreign key constraint
      await sequelize.getQueryInterface().changeColumn(
        "parentcategories",
        "brandId",
        {
          type: sequelize.Sequelize.UUID,
          allowNull: false,
          references: {
            model: "brands",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        { transaction }
      );
      console.log("Made brandId NOT NULL and added foreign key constraint.");
    });

    console.log("Successfully added brandId to parentcategories.");
  } catch (error) {
    console.error("Failed to add brandId to parentcategories:", error);
    throw error;
  }
}

addBrandIdToParentCategories();
