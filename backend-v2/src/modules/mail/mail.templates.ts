import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailMessage } from '@/common/interfaces/mail-message.interface';

@Injectable()
export class MailTemplates {
  constructor(private readonly configService: ConfigService) {}

  private baseTemplate(title: string, body: string): string {
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

  private get appHost(): string {
    return this.configService.get<string>('APP_HOST') || 'cmtradingco.com';
  }

  private get dashboardUrl(): string {
    return (
      this.configService.get<string>('DASHBOARD_URL') ||
      'https://dashboard-rocklime.vercel.app'
    );
  }

  resetPassword(resetToken: string): MailMessage {
    const url = `${this.dashboardUrl}/reset-password/${resetToken}`;
    const subject = 'Reset Your Password';

    const text = `You requested a password reset.

Please click the link below (or copy/paste in your browser) to reset your password:
${url}

If you did not request this, you can safely ignore this email.`;

    const html = this.baseTemplate(
      'Reset Your Password',
      `<p style="margin-bottom: 20px;">You requested a password reset.</p>
       <p style="margin-bottom: 20px;">Please click the button below to reset your password:</p>
       <p style="text-align: center; margin: 20px 0;">
         <a href="${url}" style="background-color: #e31e24; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Reset Password</a>
       </p>
       <p style="margin-bottom: 0;">If you did not request this, please ignore this email.</p>`,
    );

    return { subject, text, html };
  }

  confirmResetPassword(): MailMessage {
    const subject = 'Your Password Has Been Changed';

    const text = `Your password was successfully changed.

If you did not make this change, please contact our support team immediately.`;

    const html = this.baseTemplate(
      'Password Changed',
      `<p style="margin-bottom: 20px;">Your password was successfully changed.</p>
       <p style="margin-bottom: 0;">If you did not make this change, please contact our support team immediately.</p>`,
    );

    return { subject, text, html };
  }

  confirmChangePassword(name: string): MailMessage {
    return {
      subject: 'Password Changed Successfully',
      text: `Hello ${name},\n\nYour password has been changed successfully. If you did not initiate this change, please contact support immediately.\n\nBest regards,\nYour App Team`,
      html: `
        <p>Hello ${name},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you did not initiate this change, please contact support immediately.</p>
        <p>Best regards,<br>Your App Team</p>
      `,
    };
  }

  accountVerification(verificationToken: string): MailMessage {
    const url = `${this.dashboardUrl}/verify-account/${verificationToken}`;
    const subject = 'Verify Your Account';

    const text = `Thank you for registering.

Please verify your account by clicking the link below:
${url}

If you did not register, please ignore this email.`;

    const html = this.baseTemplate(
      'Verify Your Account',
      `<p style="margin-bottom: 20px;">Thank you for registering with CM Trading Co.</p>
       <p style="margin-bottom: 20px;">Click the button below to verify your account:</p>
       <p style="text-align: center; margin: 20px 0;">
         <a href="${url}" style="background-color: #3eb780; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Verify Account</a>
       </p>
       <p style="margin-bottom: 0;">If you did not register, please ignore this email.</p>`,
    );

    return { subject, text, html };
  }

  signup(name: string): MailMessage {
    const subject = 'Welcome to CM Trading Co';
    const text = `Hi ${name}!\n\nThank you for creating an account with us.`;

    const html = this.baseTemplate(
      'Welcome to CM Trading Co',
      `<p style="margin-bottom: 20px;">Hi ${name}!</p>
       <p style="margin-bottom: 0;">Thank you for creating an account with us. We're excited to have you onboard.</p>`,
    );

    return { subject, text, html };
  }

  accountVerificationConfirmation(name: string): MailMessage {
    const subject = 'Account Verification Successful';

    const text = `Hi ${name}!

Your account has been successfully verified. You can now log in to your account.

If you did not initiate this verification, please contact our support team immediately.`;

    const html = this.baseTemplate(
      'Account Verification Successful',
      `<p style="margin-bottom: 20px;">Hi ${name}!</p>
       <p style="margin-bottom: 20px;">Your account has been successfully verified. You can now log in to your account.</p>
       <p style="text-align: center; margin: 20px 0;">
         <a href="${this.dashboardUrl}/login" style="background-color: #3eb780; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Log In Now</a>
       </p>
       <p style="margin-bottom: 0;">If you did not initiate this verification, please contact our support team immediately.</p>`,
    );

    return { subject, text, html };
  }

  contactForm(name: string, message: string): MailMessage {
    const subject = 'Thank You for Contacting CM Trading Co';

    const text = `Hi ${name}!\n\nThank you for reaching out to us. We have received your message:\n\n"${message}"\n\nOur team will get back to you soon.\n\nBest regards,\nCM Trading Co`;

    const html = this.baseTemplate(
      'Thank You for Your Message',
      `<p style="margin-bottom: 20px;">Hi ${name}!</p>
       <p style="margin-bottom: 20px;">Thank you for reaching out to us. We have received your message:</p>
       <blockquote style="border-left: 3px solid #e31e24; padding-left: 12px; margin-bottom: 20px;">${message}</blockquote>
       <p style="margin-bottom: 20px;">Our team will get back to you soon.</p>
       <p style="margin-bottom: 0;">Best regards,<br>CM Trading Co</p>`,
    );

    return { subject, text, html };
  }

  adminContactNotification(
    firstName: string,
    lastName: string | undefined,
    email: string,
    phone: string | undefined,
    message: string,
  ): MailMessage {
    const subject = 'New Contact Form Submission';

    const text = `New contact form submission received:

First Name: ${firstName}
Last Name: ${lastName || 'Not provided'}
Email: ${email}
Phone: ${phone || 'Not provided'}
Message: ${message}

Please follow up with the user.`;

    const html = this.baseTemplate(
      'New Contact Form Submission',
      `<p style="margin-bottom: 20px;">A new contact form submission has been received:</p>
       <ul style="list-style: none; margin-bottom: 20px; padding: 0; line-height: 1.8;">
         <li style="list-style: disc; padding-left: 15px;"><strong>First Name:</strong> ${firstName}</li>
         <li style="list-style: disc; padding-left: 15px;"><strong>Last Name:</strong> ${lastName || 'Not provided'}</li>
         <li style="list-style: disc; padding-left: 15px;"><strong>Email:</strong> ${email}</li>
         <li style="list-style: disc; padding-left: 15px;"><strong>Phone:</strong> ${phone || 'Not provided'}</li>
         <li style="list-style: disc; padding-left: 15px;"><strong>Message:</strong> ${message}</li>
       </ul>
       <p style="margin-bottom: 0;">Please follow up with the user.</p>`,
    );

    return { subject, text, html };
  }
}
