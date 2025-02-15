const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
} = require("../controller/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);

module.exports = router;
