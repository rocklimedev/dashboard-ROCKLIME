// models/otp.model.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // 5 mins
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
