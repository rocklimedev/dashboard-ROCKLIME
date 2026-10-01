import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  roleName: string;
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class AssignRoleDto {
  @IsUUID()
  userId: string;

  @IsString()
  role: string;
}

export class CreatePermissionDto {
  @IsString()
  api: 'view' | 'delete' | 'write' | 'edit' | 'export';

  @IsString()
  name: string;

  @IsString()
  route: string;

  @IsString()
  module: string;
}
