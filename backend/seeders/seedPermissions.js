const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");
const Permission = require("../models/permisson");

(async () => {
  try {
    const dataPath = path.join(__dirname, "../permissions.json");
    const permissionsData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    let totalParsed = 0;
    let totalUpdatedOrCreated = 0;

    for (const permission of permissionsData) {
      totalParsed++;

      const [record, created] = await Permission.upsert(
        {
          permissionId: permission.permissionId || uuidv4(),
          name: permission.name,
          api: permission.api,
          route: permission.route,
          module: permission.module,
          createdAt: permission.createdAt || new Date(),
          updatedAt: new Date(),
        },
        { returning: true }
      );

      if (created || record) {
        totalUpdatedOrCreated++;
      }
    }

    console.log(`✅ Total records parsed: ${totalParsed}`);
    console.log(`✅ Total records updated/inserted: ${totalUpdatedOrCreated}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    process.exit(1);
  }
})();
