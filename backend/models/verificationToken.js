// models/verificationToken.js
const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema({
  userId: {
    type: String, // Matches UUID from MySQL User model
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: "0" }, // TTL index to auto-remove expired tokens
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("VerificationToken", verificationTokenSchema);
