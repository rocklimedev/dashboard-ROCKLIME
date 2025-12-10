// models/apiLog.js
const mongoose = require("mongoose");

const apiLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    },
    route: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      min: 100,
      max: 599,
    },
    userId: {
      type: String,
      sparse: true, // Allows multiple nulls + unique index if needed later
      index: true,
    },
    userSnapshot: {
      name: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
    },
    startTime: { type: Date, default: Date.now, required: true },
    endTime: Date,
    duration: { type: Number, min: 0 }, // in ms
    body: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    error: String,
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Compound indexes for fast filtering & sorting
apiLogSchema.index({ createdAt: -1 });
apiLogSchema.index({ userId: 1, createdAt: -1 });
apiLogSchema.index({ method: 1, createdAt: -1 });
apiLogSchema.index({ route: 1, createdAt: -1 });
apiLogSchema.index({ status: 1 });

// Text index for global search across route, body, query, error, user name/email
apiLogSchema.index(
  {
    route: "text",
    body: "text",
    query: "text",
    error: "text",
    "userSnapshot.name": "text",
    "userSnapshot.email": "text",
  },
  {
    weights: {
      route: 10,
      "userSnapshot.name": 8,
      "userSnapshot.email": 8,
      error: 5,
    },
    name: "text_search_index",
  }
);

module.exports = mongoose.model("ApiLog", apiLogSchema);
