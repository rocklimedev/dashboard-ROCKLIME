const express = require("express");
const { configureApp } = require("./middleware/configure-app");
const { registerRoutes } = require("./routes");
const { registerHealthRoutes } = require("./routes/health.route");
const { registerErrorHandlers } = require("./middleware/error-handlers");

// Building the app does not open ports or start background jobs.
function createApp({ io } = {}) {
  const app = express();
  app.set("trust proxy", 1);
  configureApp(app, io);
  registerRoutes(app);
  registerHealthRoutes(app);
  registerErrorHandlers(app);
  return app;
}

module.exports = { createApp };
