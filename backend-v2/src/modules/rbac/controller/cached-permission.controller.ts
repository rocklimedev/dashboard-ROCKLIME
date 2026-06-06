import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CachedPermissionService } from './cached-permission.service';

@Controller('cached-permissions')
export class CachedPermissionController {
  constructor(
    private readonly cachedPermissionService: CachedPermissionService,
  ) {}

  @Get()
  async getAllCachedPermissions() {
    return this.cachedPermissionService.getAll();
  }

  @Get('role/:roleId')
  async getCachedPermissionByRole(
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.cachedPermissionService.getByRoleId(roleId);
  }
}
