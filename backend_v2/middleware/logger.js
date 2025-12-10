// middleware/logger.js
const ApiLog = require("../models/apiLog");
const { User } = require("../models/users"); // Sequelize MySQL

const apiLogger = (req, res, next) => {
  const startTime = Date.now();

  // Extract user early (from JWT, not DB lookup!)
  let userSnapshot = null;
  if (req.user) {
    userSnapshot = {
      id: req.user.userId,
      name: req.user.name || req.user.username || "Unknown",
      email: req.user.email || "unknown@example.com",
    };
  }

  // Create log entry immediately (fire-and-forget)
  const logEntry = {
    method: req.method,
    route: req.originalUrl || req.url,
    status: null,
    userId: userSnapshot?.id || null,
    userSnapshot: userSnapshot
      ? {
          name: userSnapshot.name,
          email: userSnapshot.email,
        }
      : null,
    startTime: new Date(startTime),
    endTime: null,
    duration: null,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    query: req.query && Object.keys(req.query).length ? req.query : undefined,
    ipAddress:
      req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress,
    userAgent: req.get("User-Agent"),
    error: null,
  };

  // Insert log immediately in background
  ApiLog.create(logEntry)
    .then((doc) => {
      const logId = doc._id;

      // Update with response data when request finishes
      const onFinished = () => {
        const endTime = Date.now();
        const updateData = {
          status: res.statusCode,
          endTime: new Date(endTime),
          duration: endTime - startTime,
        };

        // Only log error if 4xx/5xx and no body was sent
        if (res.statusCode >= 400) {
          updateData.error = res.statusMessage || "Unknown Error";
        }

        // Fire-and-forget update
        ApiLog.updateOne({ _id: logId }, { $set: updateData }).catch(
          console.error
        );

        res.removeListener("finish", onFinished);
        res.removeListener("close", onFinished);
      };

      res.on("finish", onFinished);
      res.on("close", onFinished); // Handles aborted requests
    })
    .catch((err) => {
      console.error("Failed to create log entry:", err);
    });

  // Do NOT wait for anything — move on!
  next();
};

module.exports = apiLogger;
