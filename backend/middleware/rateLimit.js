const rateLimit = require("express-rate-limit");

// 🔹 Global API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later",
  },
});

// 🔹 Burst limiter (for sensitive routes)
const burstLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests in a short time, slow down.",
  },
});

module.exports = {
  apiLimiter,
  burstLimiter,
};
