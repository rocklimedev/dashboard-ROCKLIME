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
} = require("../controller/authController");
const checkPermission = require("../middleware/permission");
const router = express.Router();
const { emailer } = require("../middleware/sendMail");
const emails = require("../config/template");
router.get("/verify-account/:token", verifyAccount); // <-- token comes as param
router.post(
  "/register",
  //checkPermission("write", "register", "auth", "/auth/register"),
  register
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
  forgotPassword
);
router.post(
  "/reset-password",
  // checkPermission("write", "reset-password", "auth", "/auth/reset-password"),
  resetPassword
);
router.post(
  "/refresh-token",
  // checkPermission("write", "refresh-token", "auth", "/auth/refresh-token"),
  refreshToken
);
router.post("/resend-verification", resendVerificationEmail); // New endpoint
module.exports = router;
