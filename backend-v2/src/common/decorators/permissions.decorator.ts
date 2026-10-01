import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export interface RequiredPermission {
  api: 'view' | 'delete' | 'write' | 'edit' | 'export';
  name: string;
  module: string;
  route: string;
}

/**
 * Drop-in replacement for the legacy
 *   router.get('/x', checkPermission('view', 'Get X', 'module', '/x'), handler)
 * pattern. Use together with PermissionsGuard:
 *
 *   @RequirePermission({ api: 'view', name: 'Get X', module: 'module', route: '/x' })
 *   @UseGuards(JwtAuthGuard, PermissionsGuard)
 *   @Get()
 *   findAll() { ... }
 */
export const RequirePermission = (permission: RequiredPermission) =>
  SetMetadata(PERMISSION_KEY, permission);
