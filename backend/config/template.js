// emails.js

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
exports.resetEmail = (host, resetToken) => {
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
     <p>If you did not request this, you can safely ignore this email.</p>`
  );

  return { subject, text, html };
};

// 2. Confirm Password Reset
exports.confirmResetPasswordEmail = () => {
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
};

// 3. Account Verification
exports.accountVerificationEmail = (host, verificationToken) => {
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
};

// 4. User Signup Welcome
exports.signupEmail = (name) => {
  const subject = "Welcome to CM Trading Co";

  const text = `Hi ${name}!\n\nThank you for creating an account with us.`;

  const html = baseTemplate(
    "Welcome to CM Trading Co",
    `<p>Hi ${name}!</p>
     <p>Thank you for creating an account with us. We’re excited to have you onboard.</p>`
  );

  return { subject, text, html };
};
