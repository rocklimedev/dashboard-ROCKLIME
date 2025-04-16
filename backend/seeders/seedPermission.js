const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");
const Permission = require("../models/permisson");

// Regex to match checkPermission("api", "name", "module", "route")
const checkPermissionRegex = /checkPermission\(([^)]+)\)/g;

(async () => {
  try {
    const routesDir = path.join(__dirname, "../routes");
    const files = fs.readdirSync(routesDir);
    const permissions = [];

    for (const file of files) {
      const filePath = path.join(routesDir, file);
      const content = fs.readFileSync(filePath, "utf8");

      const routePrefix = "/" + file.replace(/routes\.js$/, "").toLowerCase();

      const matches = [...content.matchAll(checkPermissionRegex)];

      matches.forEach((match) => {
        const paramsRaw = match[1]
          .split(",")
          .map((s) => s.trim().replace(/^["'`](.*)["'`]$/, "$1"));

        if (paramsRaw.length < 4) return;

        const [api, name, module, route] = paramsRaw;

        // Push into list
        permissions.push({
          permissionId: uuidv4(),
          api,
          name,
          module,
          route,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    }

    console.log(`Found ${permissions.length} permissions. Inserting...`);

    await Permission.bulkCreate(permissions, {
      ignoreDuplicates: true,
    });

    console.log("✅ Permissions seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    process.exit(1);
  }
})();
