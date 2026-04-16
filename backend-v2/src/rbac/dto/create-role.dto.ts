// src/roles/dto/create-role.dto.ts
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  roleName: string;

  // Optional: if you want to assign permissions while creating role
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds?: string[];
}