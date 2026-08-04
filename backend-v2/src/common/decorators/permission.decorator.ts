import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export interface PermissionMetadata {
  api: string;
  name: string;
  module: string;
  route: string;
}

export const Permission = (
  api: string,
  name: string,
  module: string,
  route: string,
) =>
  SetMetadata(PERMISSION_KEY, {
    api,
    name,
    module,
    route,
  });