import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import {
  AssignPermissionToRoleDto,
  RolePermissionParamsDto,
} from './dto/role-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('role-permissions')
@UseGuards(JwtAuthGuard)
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post()
  @UsePipes(ValidationPipe)
  async assign(@Body() dto: AssignPermissionToRoleDto) {
    return this.rolePermissionService.assignPermissionToRole(dto);
  }

  @Delete()
  @UsePipes(ValidationPipe)
  async remove(@Body() dto: AssignPermissionToRoleDto) {
    return this.rolePermissionService.removePermissionFromRole(dto);
  }

  @Get('role/:roleId')
  async getByRole(@Param('roleId') roleId: string) {
    return this.rolePermissionService.getAllRolePermissionsByRoleId(roleId);
  }

  @Get('role/:roleId/permission/:permissionId')
  async getByRoleAndPermission(@Param() params: RolePermissionParamsDto) {
    return this.rolePermissionService.getRolePermissionByRoleAndPermission(
      params.roleId,
      params.permissionId,
    );
  }

  @Get()
  async getAll() {
    return this.rolePermissionService.getAllRolePermissions();
  }
}
