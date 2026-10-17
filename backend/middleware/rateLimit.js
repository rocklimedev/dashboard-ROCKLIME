const rateLimit = require("express-rate-limit");

// 🔹 Global API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 2000,
  // opening a catalogue reads the PDF in many small parts; those don't count
  skip: (req) => /^\/catalogues\/[^/]+\/(file|cover)$/.test(req.path),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later",
  },
});

// 🔹 Burst limiter (for sensitive routes)
const burstLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT_BURST_MAX) || 300, // per minute, per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests in a short time, slow down.",
  },
});

// 🔹 Login / password-reset limiter: 10 failed tries per account + IP in 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${String(req.body?.email || "").trim().toLowerCase()}|${rateLimit.ipKeyGenerator ? rateLimit.ipKeyGenerator(req.ip) : req.ip}`,
  message: {
    message: "Too many attempts. Wait 15 minutes and try again.",
  },
});

module.exports = {
  loginLimiter,
  apiLimiter,
  burstLimiter,
};
