require("dotenv").config();
const mongoose = require("mongoose");
const connectMongoDB = require("../config/dbMongo");
const ApiLog = require("../models/apiLog");

(async () => {
  try {
    await connectMongoDB();

    // Calculate date 1 month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await ApiLog.deleteMany({
      createdAt: { $lt: oneMonthAgo },
    });

    console.log(
      `🧹 Cleanup complete: ${result.deletedCount} records deleted (older than 1 month)`,
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
})();
