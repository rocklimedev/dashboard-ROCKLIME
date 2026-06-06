import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoleService } from './role.service';
import {
  CreateRoleDto,
  AssignRoleToUserDto,
  AssignPermissionsToRoleDto,
  UpdateRolePermissionsDto,
} from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() dto: CreateRoleDto, @Req() req) {
    return this.roleService.createRole(dto, req);
  }

  @Get()
  async findAll() {
    return this.roleService.getAllRoles();
  }

  @Get(':roleId')
  async findOne(@Param('roleId') roleId: string) {
    return this.roleService.getRoleById(roleId);
  }

  @Delete(':roleId')
  async remove(@Param('roleId') roleId: string, @Req() req) {
    return this.roleService.deleteRole(roleId, req);
  }

  // User Role Assignment
  @Post('assign-to-user')
  async assignToUser(@Body() dto: AssignRoleToUserDto, @Req() req) {
    return this.roleService.assignRoleToUser(dto, req);
  }

  @Get('recent-to-assign')
  async getRecent() {
    return this.roleService.getRecentRoleToGive();
  }

  // Role Permissions
  @Post(':roleId/permissions')
  async assignPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionsToRoleDto,
    @Req() req,
  ) {
    return this.roleService.assignPermissionsToRole(roleId, dto, req);
  }

  @Delete(':roleId/permissions')
  async removePermission(
    @Param('roleId') roleId: string,
    @Body('permissionId') permissionId: string | string[],
    @Req() req,
  ) {
    return this.roleService.removePermissionFromRole(roleId, permissionId, req);
  }

  @Put(':roleId/permissions')
  async updatePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRolePermissionsDto,
    @Req() req,
  ) {
    return this.roleService.updateRolePermissions(roleId, dto, req);
  }

  @Get(':roleId/permissions')
  async getPermissions(@Param('roleId') roleId: string) {
    return this.roleService.getRolePermissions(roleId);
  }
}
