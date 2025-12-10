const fs = require("fs");
const path = require("path");
const { ROLES } = require("../config/constant"); // Your roles object
const Role = require("../models/roles"); // Assuming you have a Role model
const Permission = require("../models/permisson"); // Assuming you have a Permission model
const routesDir = path.join(__dirname, "../routes");

const extractPermissions = (filePath, moduleName) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const permissionRegex = /checkPermission\("(\w+)",\s*"([^"]+)"\)/g;

  let match;
  const permissions = [];
  while ((match = permissionRegex.exec(content)) !== null) {
    const [_, name, route] = match;
    permissions.push({ name, route, module: moduleName });
  }
  return permissions;
};

// Seed Roles

const seedRoles = async () => {
  try {
    console.log("Seeding roles...");

    // Seed roles from ROLES object
    const roles = Object.values(ROLES);
    for (const roleName of roles) {
      await Role.findOrCreate({
        where: { roleName }, // Use roleName here instead of name
        defaults: { roleName }, // Ensure this field is used
      });
    }

    console.log("Roles seeding completed.");
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
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
      const moduleName = path.basename(file, ".js"); // Extract module name from filename
      const permissions = extractPermissions(filePath, moduleName);
      allPermissions.push(...permissions);
    });

    // Insert unique permissions into the database
    for (const { name, route, module } of allPermissions) {
      await Permission.findOrCreate({
        where: { name, route, module },
        defaults: { name, route, module },
      });
    }

    console.log("Permissions seeding completed.");
  } catch (error) {
    console.error("Error seeding permissions:", error);
  }
};

const seed = async () => {
  await seedRoles();
  // await seedPermissions();
  process.exit();
};

seed();
