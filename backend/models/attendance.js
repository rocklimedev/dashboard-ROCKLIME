const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // UUID from MySQL User model
      required: true,
      index: true, // Index for faster queries
    },
    status: {
      type: String,
      enum: ["absent", "present"],
      default: "absent",
    },
    clockIn: {
      type: Date,
      default: null,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true, // Index for date-based queries
    },
  },
  {
    timestamps: true,
    collection: "attendances", // Explicit collection name
  }
);

// Ensure unique attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
