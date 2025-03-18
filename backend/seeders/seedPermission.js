const fs = require("fs");
const path = require("path");
const Permission = require("../models/permisson"); // Import your Permission model
const routesDir = path.join(__dirname, "../routes");

const extractPermissions = (filePath, moduleName) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const permissionRegex = /checkPermission\("(\w+)",\s*"([^"]+)"\)/g;

  let match;
  const permissions = [];
  while ((match = permissionRegex.exec(content)) !== null) {
    const [_, name, route] = match;
    permissions.push({ name, route, module: moduleName }); // Add module
  }
  return permissions;
};

const seedPermissions = async () => {
  try {
    console.log("Seeding permissions...");
    const files = fs
      .readdirSync(routesDir)
      .filter((file) => file.endsWith(".js"));

    let allPermissions = [];
    files.forEach((file) => {
      const filePath = path.join(routesDir, file);
      const moduleName = path.basename(file, ".js"); // Extract module name from filename (e.g., 'address' from 'address.js')
      const permissions = extractPermissions(filePath, moduleName); // Pass moduleName to extractPermissions
      allPermissions.push(...permissions);
    });

    // Insert unique permissions into the database
    for (const { name, route, module } of allPermissions) {
      await Permission.findOrCreate({
        where: { name, route, module },
        defaults: { name, route, module }, // Insert module into the defaults
      });
    }

    console.log("Permissions seeding completed.");
  } catch (error) {
    console.error("Error seeding permissions:", error);
  }
};

seedPermissions().then(() => process.exit());
module.exports = seedPermissions;
