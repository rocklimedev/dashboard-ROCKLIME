const nodemailer = require("nodemailer");
require("dotenv").config();
// Create transporter with cPanel BigRock SMTP settings
const transporter = nodemailer.createTransport({
  host: "static.cmtradingco.com", // Your mail server
  port: 465, // SSL/TLS Port
  secure: true, // true = use SSL
  auth: {
    user: "no-reply@static.cmtradingco.com", // Full email address
    pass: process.env.SMTP_PASS || "YOUR_CPANEL_PASSWORD", // CPanel email password
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certs if needed
  },
  logger: true, // Enable logs
  debug: true, // Show debug output
});

// Verify connection config
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP config error:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

// Send email function
async function sendMail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"CM Trading Co" <no-reply@static.cmtradingco.com>`, // Must match cPanel email
      to, // Recipient
      subject, // Subject
      text, // Plain text
      html, // HTML body
    });
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
}

function emailer(templateFn) {
  return async (req, res, next) => {
    if (res.headersSent) {
      console.warn("Headers already sent, skipping emailer");
      return next();
    }
    try {
      const { to, params } = req.email;
      console.log(`Sending email to: ${to}`);
      if (typeof templateFn !== "function") {
        throw new Error(`templateFn is not a function: ${templateFn}`);
      }
      const msg = templateFn(...params);
      await sendMail(to, msg.subject, msg.text, msg.html);
      console.log(`Email sent successfully to: ${to}`);
      next();
    } catch (err) {
      console.error(`Email error for ${req.email.to}:`, err);
      next(err);
    }
  };
}

// Base HTML template for all emails
function baseTemplate(title, body) {
  return `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; overflow:hidden;">
    <div style="background:#222; color:#fff; padding:16px; text-align:center; font-size:20px; font-weight:bold;">
      CM Trading Co
    </div>
    <div style="padding:24px; font-size:15px; line-height:1.6; color:#333;">
      <h2 style="color:#222; margin-top:0;">${title}</h2>
      ${body}
    </div>
    <div style="background:#f8f8f8; padding:12px; text-align:center; font-size:13px; color:#777;">
      © ${new Date().getFullYear()} CM Trading Co. All rights reserved.
    </div>
  </div>`;
}

// 1. Password Reset
function resetEmail(host, resetToken) {
  const url = `http://${host}/reset-password/${resetToken}`;
  const subject = "Reset Your Password";

  const text = `
You requested a password reset.

Please click the link below (or copy/paste in your browser) to reset your password:
${url}

If you did not request this, you can safely ignore this email.`;

  const html = baseTemplate(
    "Reset Your Password",
    `<p>You requested a password reset.</p>
     <p>Please click the button below to reset your password:</p>
     <p style="text-align:center; margin:20px 0;">
       <a href="${url}" style="background:#007bff; color:#fff; padding:12px 20px; border-radius:5px; text-decoration:none; font-weight:bold;">Reset Password</a>
     </p>
     <p>If you did not request this, please ignore this email.</p>`
  );

  return { subject, text, html };
}

// 2. Confirm Password Reset
function confirmResetPasswordEmail() {
  const subject = "Your Password Has Been Changed";

  const text = `
Your password was successfully changed.

If you did not make this change, please contact our support team immediately.`;

  const html = baseTemplate(
    "Password Changed",
    `<p>Your password was successfully changed.</p>
     <p>If you did not make this change, please contact our support team immediately.</p>`
  );

  return { subject, text, html };
}

// 3. Account Verification
function accountVerificationEmail(host, verificationToken) {
  const url = `http://${host}/verify-account/${verificationToken}`;
  const subject = "Verify Your Account";

  const text = `
Thank you for registering.

Please verify your account by clicking the link below:
${url}

If you did not register, please ignore this email.`;

  const html = baseTemplate(
    "Verify Your Account",
    `<p>Thank you for registering with CM Trading Co.</p>
     <p>Click the button below to verify your account:</p>
     <p style="text-align:center; margin:20px 0;">
       <a href="${url}" style="background:#28a745; color:#fff; padding:12px 20px; border-radius:5px; text-decoration:none; font-weight:bold;">Verify Account</a>
     </p>
     <p>If you did not register, please ignore this email.</p>`
  );

  return { subject, text, html };
}

// 4. User Signup Welcome
function signupEmail(name) {
  const subject = "Welcome to CM Trading Co";

  const text = `Hi ${name}!\n\nThank you for creating an account with us.`;

  const html = baseTemplate(
    "Welcome to CM Trading Co",
    `<p>Hi ${name}!</p>
     <p>Thank you for creating an account with us. We’re excited to have you onboard.</p>`
  );

  return { subject, text, html };
}

// 5. Account Verification Confirmation
function accountVerificationConfirmationEmail(name) {
  const subject = "Account Verification Successful";

  const text = `
Hi ${name}!\n\nYour account has been successfully verified. You can now log in to your account.\n\nIf you did not initiate this verification, please contact our support team immediately.`;

  const html = baseTemplate(
    "Account Verification Successful",
    `<p>Hi ${name}!</p>
     <p>Your account has been successfully verified. You can now log in to your account.</p>
     <p style="text-align:center; margin:20px 0;">
       <a href="http://static.cmtradingco.com/login" style="background:#28a745; color:#fff; padding:12px 20px; border-radius:5px; text-decoration:none; font-weight:bold;">Log In Now</a>
     </p>
     <p>If you did not initiate this verification, please contact our support team immediately.</p>`
  );

  return { subject, text, html };
}

module.exports = {
  sendMail,
  emailer,
  resetEmail,
  confirmResetPasswordEmail,
  accountVerificationEmail,
  signupEmail,
  accountVerificationConfirmationEmail,
};
