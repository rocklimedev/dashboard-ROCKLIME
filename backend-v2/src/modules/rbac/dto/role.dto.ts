import { IsString, IsUUID, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ROLES } from '../config/constant';

export class CreateRoleDto {
  @IsString()
  roleName: string;
}

export class AssignRoleToUserDto {
  @IsUUID()
  userId: string;

  @IsEnum(ROLES)
  role: string;
}

export class AssignPermissionsToRoleDto {
  @IsArray()
  permissionIds: string[]; // Support single or multiple
}

export class UpdateRolePermissionsDto {
  @IsArray()
  permissionIds: string[];
}
