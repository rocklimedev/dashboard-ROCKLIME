// routes/otp.js
const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp } = require("../controller/otpController");

router.post("/send", sendOtp);
router.post("/verify", verifyOtp);

module.exports = router;
