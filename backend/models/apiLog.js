const mongoose = require("mongoose");

const apiLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    },
    route: { type: String, required: true, trim: true },
    status: { type: Number, min: 100, max: 599 },
    userId: { type: String, sparse: true, index: true },
    userSnapshot: {
      name: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
    },
    startTime: { type: Date, default: Date.now, required: true },
    endTime: Date,
    duration: { type: Number, min: 0 },
    body: {
      type: mongoose.Schema.Types.Mixed,
      get: (v) => (v && JSON.stringify(v).length > 1000 ? "[TRUNCATED]" : v),
    },
    query: {
      type: mongoose.Schema.Types.Mixed,
      get: (v) => (v && JSON.stringify(v).length > 500 ? "[TRUNCATED]" : v),
    },
    ipAddress: String,
    userAgent: String,
    error: String,
  },
  { timestamps: true },
);

// --- Indexes ---

// Keep essential compound indexes only
apiLogSchema.index({ createdAt: 1 }); // for TTL & queries by date
apiLogSchema.index({ userId: 1, createdAt: -1 }); // for user-based queries
apiLogSchema.index({ route: 1, createdAt: -1 }); // route-based filtering

// Optional text index for minimal search
apiLogSchema.index(
  { route: "text", error: "text" },
  {
    weights: { route: 5, error: 2 },
    name: "text_search_index",
  },
);

// --- TTL for automatic cleanup ---
apiLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }, // auto-delete logs older than 30 days
);

module.exports = mongoose.model("ApiLog", apiLogSchema);
