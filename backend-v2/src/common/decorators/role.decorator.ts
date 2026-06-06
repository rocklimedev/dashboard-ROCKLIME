import { SetMetadata } from '@nestjs/common';

export const AllowedRoles = (...roleIds: string[]) =>
  SetMetadata('allowedRoleIds', roleIds);
