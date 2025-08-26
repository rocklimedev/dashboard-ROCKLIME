// emailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

/* -----------------------------------------------------------
   1. Transporter Setup
------------------------------------------------------------ */
const transporter = nodemailer.createTransport({
  host: "static.cmtradingco.com",
  port: 465,
  secure: true,
  auth: {
    user: "no-reply@static.cmtradingco.com",
    pass: process.env.SMTP_PASS || "KB_*d-~[!ST=",
  },
  logger: true,
  debug: true,
});

// Verify connection
transporter
  .verify()
  .then(() => console.log("✅ SMTP connected successfully"))
  .catch((err) => console.error("❌ SMTP connection failed:", err));

/* -----------------------------------------------------------
   2. Send Mail Helper
------------------------------------------------------------ */
async function sendMail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: `"CM Trading Co" <no-reply@static.cmtradingco.com>`, // Must match cPanel email
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
}

/* -----------------------------------------------------------
   3. Middleware Wrapper
------------------------------------------------------------ */
function emailer(templateFn) {
  return async (req, res, next) => {
    if (res.headersSent) {
      console.warn("⚠️ Headers already sent, skipping emailer");
      return next();
    }

    try {
      const { to, params } = req.email;
      console.log(`📩 Sending email to: ${to}`);

      if (typeof templateFn !== "function") {
        throw new Error(`templateFn is not a function: ${templateFn}`);
      }

      const msg = templateFn(...params);
      await sendMail(to, msg.subject, msg.text, msg.html);

      console.log(`✅ Email sent successfully to: ${to}`);
      next();
    } catch (err) {
      console.error(`❌ Email error for ${req.email?.to}:`, err);
      next(err);
    }
  };
}

/* -----------------------------------------------------------
   4. Base Template
------------------------------------------------------------ */
function baseTemplate(title, body) {
  return `
  <div style="font-family: 'Lato', Arial, sans-serif; font-size: 14px; color: #646b72; line-height: 1.5; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; background-color: #f7f7f7;">
    <div style="background-color: #222; color: #fff; padding: 16px; text-align: center; font-size: 20px; font-weight: bold;">
      CM Trading Co
    </div>
    <div style="padding: 24px; font-size: 15px; line-height: 1.6; color: #333;">
      <h2 style="color: #212b36; font-family: 'Lato', Arial, sans-serif; font-weight: 700; margin-bottom: 0;">${title}</h2>
      ${body}
    </div>
    <div style="background-color: #f8f8f8; padding: 12px; text-align: center; font-size: 13px; color: #777;">
      © ${new Date().getFullYear()} CM Trading Co. All rights reserved.
    </div>
  </div>`;
}

/* -----------------------------------------------------------
   5. Templates
------------------------------------------------------------ */

// Password Reset
function resetEmail(host, resetToken) {
  const appHost = process.env.APP_HOST || host || "cmtradingco.com";
  const url = `https://dashboard-rocklime.vercel.app/reset-password/${resetToken}`;
  const subject = "Reset Your Password";

  const text = `
You requested a password reset.

Please click the link below (or copy/paste in your browser) to reset your password:
${url}

If you did not request this, you can safely ignore this email.`;

  const html = baseTemplate(
    "Reset Your Password",
    `<p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">You requested a password reset.</p>
     <p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Please click the button below to reset your password:</p>
     <p style="text-align: center; margin: 20px 0;">
       <a href="${url}" style="background-color: #e31e24; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; font-family: 'Lato', Arial, sans-serif;">Reset Password</a>
     </p>
     <p style="margin-bottom: 0; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">If you did not request this, please ignore this email.</p>`
  );

  return { subject, text, html };
}

// Confirm Password Reset
function confirmResetPasswordEmail() {
  const subject = "Your Password Has Been Changed";

  const text = `
Your password was successfully changed.

If you did not make this change, please contact our support team immediately.`;

  const html = baseTemplate(
    "Password Changed",
    `<p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Your password was successfully changed.</p>
     <p style="margin-bottom: 0; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">If you did not make this change, please contact our support team immediately.</p>`
  );

  return { subject, text, html };
}

// Account Verification
function accountVerificationEmail(host, verificationToken) {
  const url = `https://dashboard-rocklime.vercel.app/verify-account/${verificationToken}`;
  const subject = "Verify Your Account";

  const text = `
Thank you for registering.

Please verify your account by clicking the link below:
${url}

If you did not register, please ignore this email.`;

  const html = baseTemplate(
    "Verify Your Account",
    `<p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Thank you for registering with CM Trading Co.</p>
     <p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Click the button below to verify your account:</p>
     <p style="text-align: center; margin: 20px 0;">
       <a href="${url}" style="background-color: #3eb780; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; font-family: 'Lato', Arial, sans-serif;">Verify Account</a>
     </p>
     <p style="margin-bottom: 0; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">If you did not register, please ignore this email.</p>`
  );

  return { subject, text, html };
}

// Signup Welcome
function signupEmail(name) {
  const subject = "Welcome to CM Trading Co";

  const text = `Hi ${name}!\n\nThank you for creating an account with us.`;

  const html = baseTemplate(
    "Welcome to CM Trading Co",
    `<p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Hi ${name}!</p>
     <p style="margin-bottom: 0; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Thank you for creating an account with us. We’re excited to have you onboard.</p>`
  );

  return { subject, text, html };
}

// Account Verification Confirmation
function accountVerificationConfirmationEmail(name) {
  const subject = "Account Verification Successful";

  const text = `
Hi ${name}!\n\nYour account has been successfully verified. You can now log in to your account.\n\nIf you did not initiate this verification, please contact our support team immediately.`;

  const html = baseTemplate(
    "Account Verification Successful",
    `<p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Hi ${name}!</p>
     <p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Your account has been successfully verified. You can now log in to your account.</p>
     <p style="text-align: center; margin: 20px 0;">
       <a href="https://dashboard-rocklime.vercel.app/login" style="background-color: #3eb780; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; font-family: 'Lato', Arial, sans-serif;">Log In Now</a>
     </p>
     <p style="margin-bottom: 0; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">If you did not initiate this verification, please contact our support team immediately.</p>`
  );

  return { subject, text, html };
}

// Contact Form Confirmation
function contactFormEmail(name, message) {
  const subject = "Thank You for Contacting CM Trading Co";

  const text = `
Hi ${name}!\n\nThank you for reaching out to us. We have received your message:\n\n"${message}"\n\nOur team will get back to you soon.\n\nBest regards,\nCM Trading Co`;

  const html = baseTemplate(
    "Thank You for Your Message",
    `<p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Hi ${name}!</p>
     <p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Thank you for reaching out to us. We have received your message:</p>
     <blockquote style="border-left: 3px solid #e31e24; padding-left: 12px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">${message}</blockquote>
     <p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Our team will get back to you soon.</p>
     <p style="margin-bottom: 0; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Best regards,<br>CM Trading Co</p>`
  );

  return { subject, text, html };
}

// Admin Notification for Contact Form
function adminContactNotification(firstName, lastName, email, phone, message) {
  const subject = "New Contact Form Submission";

  const text = `
New contact form submission received:\n\n
First Name: ${firstName}\n
Last Name: ${lastName || "Not provided"}\n
Email: ${email}\n
Phone: ${phone || "Not provided"}\n
Message: ${message}\n\n
Please follow up with the user.`;

  const html = baseTemplate(
    "New Contact Form Submission",
    `<p style="margin-bottom: 20px; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">A new contact form submission has been received:</p>
     <ul style="list-style: none; margin-bottom: 20px; padding: 0; line-height: 1.8; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px;">
       <li style="list-style: disc; padding-left: 15px;"><strong style="font-weight: 700;">First Name:</strong> ${firstName}</li>
       <li style="list-style: disc; padding-left: 15px;"><strong style="font-weight: 700;">Last Name:</strong> ${
         lastName || "Not provided"
       }</li>
       <li style="list-style: disc; padding-left: 15px;"><strong style="font-weight: 700;">Email:</strong> ${email}</li>
       <li style="list-style: disc; padding-left: 15px;"><strong style="font-weight: 700;">Phone:</strong> ${
         phone || "Not provided"
       }</li>
       <li style="list-style: disc; padding-left: 15px;"><strong style="font-weight: 700;">Message:</strong> ${message}</li>
     </ul>
     <p style="margin-bottom: 0; color: #646b72; font-family: 'Lato', Arial, sans-serif; font-size: 14px; line-height: 1.5;">Please follow up with the user.</p>`
  );

  return { subject, text, html };
}

/* -----------------------------------------------------------
   6. Exports
------------------------------------------------------------ */
module.exports = {
  sendMail,
  emailer,
  resetEmail,
  confirmResetPasswordEmail,
  accountVerificationEmail,
  signupEmail,
  accountVerificationConfirmationEmail,
  contactFormEmail,
  adminContactNotification,
};
