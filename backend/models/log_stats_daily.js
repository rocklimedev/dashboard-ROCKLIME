// models/logStatsDaily.js
const mongoose = require("mongoose");

const LogStatsDailySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true }, // YYYY-MM-DD 00:00:00
    totalRequests: { type: Number, default: 0 },
    avgDuration: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    methodBreakdown: { type: Object, default: {} },
    statusBreakdown: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LogStatsDaily", LogStatsDailySchema);
