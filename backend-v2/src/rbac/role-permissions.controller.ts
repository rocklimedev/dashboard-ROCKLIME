// src/role-permissions/role-permissions.controller.ts
import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common';
import { RolePermissionsService } from './roles-permisisons.service';
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(private readonly rpService: RolePermissionsService) {}

  @Post()
  assign(@Body('roleId') roleId: string, @Body('permissionId') permissionId: string) {
    return this.rpService.assignPermission(roleId, permissionId);
  }

  @Delete()
  remove(@Body('roleId') roleId: string, @Body('permissionId') permissionId: string) {
    return this.rpService.removePermission(roleId, permissionId);
  }

  @Get(':roleId')
  getByRole(@Param('roleId') roleId: string) {
    return this.rpService.getRolePermissions(roleId);
  }

  @Put(':roleId')
  update(@Param('roleId') roleId: string, @Body('permissions') permissions: string[]) {
    return this.rpService.updateRolePermissions(roleId, permissions);
  }
}