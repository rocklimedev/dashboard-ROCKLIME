import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignPermissionToRoleDto {
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsUUID()
  @IsNotEmpty()
  permissionId: string;
}

export class RolePermissionParamsDto {
  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsUUID()
  @IsNotEmpty()
  permissionId: string;
}
