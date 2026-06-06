import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from './models/role.model';
import { User } from '../users/models/user.model';
import { Permission } from './models/permission.model';
import { RolePermission } from './models/role-permission.model';
import { RoleController } from './controller/role.controller';
import { RoleService } from './services/role.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Role, User, Permission, RolePermission]),
  ],
  controllers: [RoleController],
  providers: [RoleService, ActivityLogService],
  exports: [RoleService],
})
export class RoleModule {}
