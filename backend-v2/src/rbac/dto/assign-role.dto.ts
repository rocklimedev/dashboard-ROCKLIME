// src/roles/dto/assign-role.dto.ts
import { IsUUID, IsString, IsEnum } from 'class-validator';

export class AssignRoleDto {
  @IsUUID()
  userId: string;

  @IsString()
  role: string; // "SuperAdmin", "Users", etc.
}