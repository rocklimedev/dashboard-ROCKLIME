import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolePermission } from '../models/role-permission.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { RolePermissionController } from './role-permission.controller';
import { RolePermissionService } from './role-permission.service';

@Module({
  imports: [SequelizeModule.forFeature([RolePermission, Role, Permission])],
  controllers: [RolePermissionController],
  providers: [RolePermissionService],
  exports: [RolePermissionService],
})
export class RolePermissionModule {}
