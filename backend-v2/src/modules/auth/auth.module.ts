// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { User } from '@/modules/users/entities/user.entity';
import { Role } from '@/modules/roles/entities/role.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { ActivityLoggerService } from '@/common/services/activity-logger.service';
import { EmailService } from '@/common/services/email.service';

@Module({
  imports: [SequelizeModule.forFeature([User, Role, VerificationToken])],
  controllers: [AuthController],
  providers: [AuthService, ActivityLoggerService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
