import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { Role } from '../models/role.model';
import { Address } from '../models/address.model';
import { UserController } from './controller/user.controller';
import { UserService } from './services/user.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Module({
  imports: [SequelizeModule.forFeature([User, Role, Address])],
  controllers: [UserController],
  providers: [UserService, ActivityLogService],
  exports: [UserService],
})
export class UserModule {}
