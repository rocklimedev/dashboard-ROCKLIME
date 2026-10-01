import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesService } from './roles.service';
import {
  AssignRoleDto,
  CreateRoleDto,
  UpdateRolePermissionsDto,
} from './dto/role.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermission({ api: 'write', name: 'create_role', module: 'roles', route: '/roles' })
  create(
    @Body() dto: CreateRoleDto,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.rolesService.create(dto, actorId, req);
  }

  @Get()
  @RequirePermission({ api: 'view', name: 'get_all_roles', module: 'roles', route: '/roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('recent')
  findRecent() {
    return this.rolesService.findRecent();
  }

  @Get(':roleId')
  findOne(@Param('roleId') roleId: string) {
    return this.rolesService.findOne(roleId);
  }

  @Put(':roleId')
  @RequirePermission({
    api: 'edit',
    name: 'update_role_permissions',
    module: 'roles',
    route: '/roles/:roleId',
  })
  updatePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.rolesService.updatePermissions(roleId, dto, actorId, req);
  }

  @Delete(':roleId')
  @RequirePermission({
    api: 'delete',
    name: 'delete_role',
    module: 'roles',
    route: '/roles/:roleId',
  })
  remove(
    @Param('roleId') roleId: string,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.rolesService.remove(roleId, actorId, req);
  }

  @Post(':roleId/permissions')
  assignPermissions(
    @Param('roleId') roleId: string,
    @Body('permissionIds') permissionIds: string[],
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.rolesService.assignPermissions(roleId, permissionIds, actorId, req);
  }

  @Delete(':roleId/permissions/:permissionId')
  removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.rolesService.removePermission(roleId, permissionId, actorId, req);
  }

  @Post('assign-role')
  assignRole(
    @Body() dto: AssignRoleDto,
    @CurrentUser('userId') actorId: string,
    @Req() req: Request,
  ) {
    return this.rolesService.assignRole(dto, actorId, req);
  }
}
