// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '@/modules/users/models/user.model';
import { Role } from '@/modules/rbac/models/role.model';
import { VerificationToken } from '@/modules/auth/models/verification-token.model';
import { ActivityLogService } from '@/modules/engagement/services/activity-log.service';
import { MailService } from '@/modules/mail/mail.service';

@Module({
  imports: [SequelizeModule.forFeature([User, Role, VerificationToken])],
  controllers: [AuthController],
  providers: [AuthService, ActivityLogService, MailService],
  exports: [AuthService],
})
export class AuthModule {}
