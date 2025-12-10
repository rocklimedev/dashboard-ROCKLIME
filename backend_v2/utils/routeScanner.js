const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Permission = require("./models/permission"); // Import your Permission model

const app = express(); // Your Express app instance

// Function to get all routes from Express
const getRoutes = () => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // If it's a route, extract its methods and path
      const methods = Object.keys(middleware.route.methods).reduce((acc, method) => {
        acc[method.toUpperCase()] = true; // Mark available methods
        return acc;
      }, { POST: false, GET: false, PUT: false, DELETE: false });

      routes.push({
        path: middleware.route.path,
        methods,
      });
    }
  });
  return routes;
};

// Function to insert routes as permissions in DB
const syncRoutesToPermissions = async () => {
  const routes = getRoutes();

  for (const route of routes) {
    const existingPermission = await Permission.findOne({ where: { action: route.path } });

    if (!existingPermission) {
      await Permission.create({
        id: uuidv4(),
        action: route.path, // Store the route path as action
        methods: route.methods,
      });
      console.log(`✅ Added permission for route: ${route.path}`);
    }
  }
};

// Run it once during startup
syncRoutesToPermissions().then(() => console.log("🔄 Routes synced to permissions!"));
