const { v4: uuidv4 } = require("uuid");
const listRoutes = require("../middleware/routeScanner");
const app = require("../index"); // Import the Express app

const roleMap = {
  SUPER_ADMIN: ["*"], // Access to all routes
  ADMIN: ["*"],
  ACCOUNTS: ["/customers", "/orders", "/quotations"],
  SALES: [
    "/keywords",
    "/parent-category",
    "/category",
    "/vendors",
    "/brands",
    "/quotations",
    "/orders",
  ],
  DEVELOPER: ["*"], // Access to all routes
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const routes = listRoutes(app); // Fetch all available routes

    let permissions = [];

    Object.entries(roleMap).forEach(([role, allowedRoutes]) => {
      routes.forEach((route) => {
        if (allowedRoutes.includes("*") || allowedRoutes.includes(route.path)) {
          permissions.push({
            id: uuidv4(),
            roleName: role,
            action: `${route.method} ${route.path}`, // e.g., "GET /users"
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    });

    // Insert into the database
    await queryInterface.bulkInsert("Permissions", permissions, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Permissions", null, {});
  },
};
