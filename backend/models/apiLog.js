const mongoose = require("mongoose");

const apiLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      required: false,
    },
    user: {
      type: {
        id: String,
        name: String,
        email: String,
      },
      required: false,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: false,
    },
    duration: {
      type: Number,
      required: false,
    },
    body: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    query: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    error: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

apiLogSchema.index({ route: 1, method: 1, startTime: -1 });
apiLogSchema.index({ "user.id": 1, startTime: -1 });

module.exports = mongoose.model("ApiLog", apiLogSchema);
