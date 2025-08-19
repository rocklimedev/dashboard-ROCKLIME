const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyAccount,
} = require("../controller/authController");
const checkPermission = require("../middleware/permission");
const router = express.Router();
const { emailer } = require("../middleware/sendMail");
const emails = require("../config/template");
router.post("/verify-account", verifyAccount); // New endpoint
router.post(
  "/register",
  //checkPermission("write", "register", "auth", "/auth/register"),
  register,
  emailer(emails.accountVerificationEmail)
);
router.post(
  "/login",
  //checkPermission("write", "login", "auth", "/auth/login"),
  login
);
router.post(
  "/logout",
  //checkPermission("write", "logout", "auth", "/auth/logout"),
  logout
);
router.post(
  "/forgot-password",
  // checkPermission(
  //   "write",
  //   "register",
  //   "forgot-password",
  //   "/auth/forgot-password"
  // ),
  forgotPassword,
  emailer(emails.resetEmail)
);
router.post(
  "/reset-password",
  // checkPermission("write", "reset-password", "auth", "/auth/reset-password"),
  resetPassword,
  emailer(emails.confirmResetPasswordEmail)
);
router.post(
  "/refresh-token",
  // checkPermission("write", "refresh-token", "auth", "/auth/refresh-token"),
  refreshToken
);

module.exports = router;
