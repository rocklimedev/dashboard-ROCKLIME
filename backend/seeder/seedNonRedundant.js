const sequelize = require("../config/database"); // Import Sequelize instance
const { QueryTypes } = require("sequelize");

async function removeRedundantKeys() {
  try {
    console.log("Connected to the database.");

    // 1. Get redundant indexes
    const indexes = await sequelize.query(
      `
      SELECT TABLE_NAME, INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      GROUP BY TABLE_NAME, INDEX_NAME
      HAVING COUNT(*) > 1;
      `,
      { type: QueryTypes.SELECT }
    );

    // 2. Drop redundant indexes
    for (const { TABLE_NAME, INDEX_NAME } of indexes) {
      console.log(`Dropping index ${INDEX_NAME} from ${TABLE_NAME}`);
      await sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` DROP INDEX \`${INDEX_NAME}\`;`
      );
    }

    // 3. Get redundant foreign keys
    const foreignKeys = await sequelize.query(
      `
      SELECT TABLE_NAME, CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      GROUP BY TABLE_NAME, CONSTRAINT_NAME
      HAVING COUNT(*) > 1;
      `,
      { type: QueryTypes.SELECT }
    );

    // 4. Drop redundant foreign keys
    for (const { TABLE_NAME, CONSTRAINT_NAME } of foreignKeys) {
      console.log(`Dropping foreign key ${CONSTRAINT_NAME} from ${TABLE_NAME}`);
      await sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` DROP FOREIGN KEY \`${CONSTRAINT_NAME}\`;`
      );
    }

    console.log("Redundant indexes and foreign keys removed successfully.");
  } catch (error) {
    console.error("Error removing redundant keys:", error);
  } finally {
    await sequelize.close(); // Close connection
    console.log("Database connection closed.");
  }
}

// Run the function
removeRedundantKeys();
