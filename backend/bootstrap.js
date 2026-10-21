const { createServer } = require("http");
const { createApp } = require("./app");
const { createSocketServer, initializeSockets } = require("./socket/create-socket-server");
const connectMongoDB = require("./config/dbMongo");
const keys = require("./config/keys");
const { startScheduledJobs } = require("./jobs/scheduled-jobs");
const { startKeepAlive } = require("./jobs/keep-alive");

function bootstrap() {
  const app = createApp();
  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);
  app.locals.io = io;
  connectMongoDB();
  startScheduledJobs();
  initializeSockets(io);
  startKeepAlive();
  const port = keys.port || process.env.PORT || 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`WebSocket ready on ws://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
  return { app, httpServer, io };
}

module.exports = { bootstrap };
