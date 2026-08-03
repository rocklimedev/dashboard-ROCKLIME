import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailTemplates } from './mail.templates';

@Module({
  imports: [ConfigModule],
  providers: [MailService, MailTemplates],
  exports: [MailService],
})
export class MailModule {}