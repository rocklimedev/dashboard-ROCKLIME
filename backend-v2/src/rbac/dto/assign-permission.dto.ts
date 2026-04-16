// src/role-permissions/dto/assign-permission.dto.ts
import { IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @IsUUID()
  roleId: string;

  @IsUUID()
  permissionId: string;
}