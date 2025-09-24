const OTP = require("../models/otp");
const nodemailer = require("nodemailer");
const emailTemplates = require("../config/template");

const transporter = nodemailer.createTransport({
  host: "mail.YOURDOMAIN.com",
  port: 465,
  secure: true,
  auth: {
    user: "otp@yourdomain.com",
    pass: process.env.SMTP_PASSWORD,
  },
});

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOtp = async (req, res) => {
  const {
    email,
    type = "generic",
    name = {},
    host = req.headers.origin,
  } = req.body;

  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });

  const otpCode = generateOtp();

  try {
    await OTP.create({ email, code: otpCode });

    // Choose the email template dynamically
    let emailContent = {};
    switch (type) {
      case "signup":
        emailContent = emailTemplates.signupEmail(name);
        break;
      case "reset":
        emailContent = emailTemplates.passwordResetRequestEmail(host, otpCode);
        break;
      case "verify":
        emailContent = emailTemplates.accountVerificationEmail(host, otpCode);
        break;
      case "generic":
      default:
        emailContent = {
          subject: "Your One-Time Password",
          text: `Hi! Your OTP is ${otpCode}. It will expire in 5 minutes.`,
        };
        break;
    }

    await transporter.sendMail({
      from: `"Time Office" <otp@yourdomain.com>`,
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code)
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP code are required" });

  try {
    const record = await OTP.findOne({ email, code });

    if (!record) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    await OTP.deleteOne({ _id: record._id });

    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};
