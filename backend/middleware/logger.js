const ApiLog = require("../models/apiLog");
const { User } = require("../models/users"); // Import MySQL User model

const logger = async (req, res, next) => {
  const startTime = new Date();

  let userData = null;
  if (req.user) {
    try {
      const user = await User.findOne({
        where: { userId: req.user.userId },
        attributes: ["userId", "name", "email"],
      });
      if (user) {
        userData = {
          id: user.userId,
          name: user.name || "Unknown",
          email: user.email || "Unknown",
        };
      }
    } catch (error) {
      console.error("Error fetching user data for logging:", error);
    }
  }

  const logEntry = new ApiLog({
    method: req.method,
    route: req.originalUrl,
    user: userData,
    startTime,
    body: req.body,
    query: req.query,
    ipAddress: req.ip || req.connection.remoteAddress,
  });

  try {
    await logEntry.save();

    res.on("finish", async () => {
      const endTime = new Date();
      try {
        await ApiLog.updateOne(
          { _id: logEntry._id },
          {
            $set: {
              status: res.statusCode,
              endTime,
              duration: endTime - startTime,
            },
          }
        );
      } catch (error) {
        console.error("Error updating log:", error);
      }
    });

    next();
  } catch (error) {
    console.error("Error logging request:", error);
    await ApiLog.updateOne(
      { _id: logEntry._id },
      { $set: { error: error.message } }
    );
    next(error);
  }
};

module.exports = logger;
