const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyAccount,
  resendVerificationEmail,
  validateResetToken,
  changePassword,
  getAllPermissionsOfLoggedInUser,
  validateToken,
  deactivateAccount,
} = require("./auth.controller");
const { loginLimiter } = require("../../middleware/rateLimit");
const { auth } = require("../../middleware/auth"); // Authentication Middleware
const router = express.Router();
const { emailer } = require("../../middleware/sendMail");
const emails = require("../../config/template");

router.get("/validate-reset-token/:token", validateResetToken);
router.get("/verify-account/:token", verifyAccount); // <-- token comes as param
router.post(
  "/register",
  register,
);
router.post("/login", loginLimiter, login);
router.post(
  "/logout",
  logout,
);
router.post("/forgot-password", loginLimiter, forgotPassword);
router.post(
  "/reset-password",
  resetPassword,
);
router.post("/change-password", auth, changePassword);
router.post(
  "/refresh-token",
  refreshToken,
);
router.post("/resend-verification", resendVerificationEmail); // New endpoint

router.get("/me/permissions", auth, getAllPermissionsOfLoggedInUser);
// POST /auth/deactivate-account  (or /users/deactivate)
router.post("/deactivate-account", auth, deactivateAccount);
router.get("/validate-token", validateToken);
module.exports = router;
