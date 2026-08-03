import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailMessage } from '@/common/interfaces/mail-message.interface';
import { MailTemplates } from './mail.templates';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(
    private readonly configService: ConfigService,
    public readonly templates: MailTemplates,
  ) {
    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      'no-reply@static.cmtradingco.com';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'sh200.bigrock.com'),
      port: this.configService.get<number>('SMTP_PORT', 465),
      secure: this.configService.get<boolean>('SMTP_SECURE', true),
      auth: {
        user: this.configService.get<string>(
          'SMTP_USER',
          'no-reply@static.cmtradingco.com',
        ),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      logger: this.configService.get<boolean>('SMTP_DEBUG', false),
      debug: this.configService.get<boolean>('SMTP_DEBUG', false),
    });
  }

  /**
   * Verifies the SMTP connection on module bootstrap.
   * (Equivalent to the standalone `.verify()` call in the old file.)
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connected successfully');
    } catch (err) {
      this.logger.error(
        'SMTP connection failed',
        err instanceof Error ? err.stack : err,
      );
    }
  }

  /**
   * Low-level send. Prefer the typed helpers below (sendResetPassword, sendSignupWelcome, etc.)
   * when sending one of the known templates.
   */
  async send(
    to: string,
    message: MailMessage,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      const info = await this.transporter.sendMail({
        from: `"CM Trading Co" <${this.fromAddress}>`,
        to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      this.logger.error(
        `Error sending email to ${to}`,
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
  }

  /* -----------------------------------------------------------
     Convenience wrappers around MailTemplates
  ------------------------------------------------------------ */

  sendResetPassword(to: string, resetToken: string) {
    return this.send(to, this.templates.resetPassword(resetToken));
  }

  sendConfirmResetPassword(to: string) {
    return this.send(to, this.templates.confirmResetPassword());
  }

  sendConfirmChangePassword(to: string, name: string) {
    return this.send(to, this.templates.confirmChangePassword(name));
  }

  sendAccountVerification(to: string, verificationToken: string) {
    return this.send(to, this.templates.accountVerification(verificationToken));
  }

  sendSignupWelcome(to: string, name: string) {
    return this.send(to, this.templates.signup(name));
  }

  sendAccountVerificationConfirmation(to: string, name: string) {
    return this.send(to, this.templates.accountVerificationConfirmation(name));
  }

  sendContactFormConfirmation(to: string, name: string, message: string) {
    return this.send(to, this.templates.contactForm(name, message));
  }

  sendAdminContactNotification(
    to: string,
    firstName: string,
    lastName: string | undefined,
    email: string,
    phone: string | undefined,
    message: string,
  ) {
    return this.send(
      to,
      this.templates.adminContactNotification(
        firstName,
        lastName,
        email,
        phone,
        message,
      ),
    );
  }
}
