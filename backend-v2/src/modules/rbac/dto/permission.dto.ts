import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  api: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  module: string;

  @IsNotEmpty()
  @IsString()
  route: string;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  api?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  route?: string;
}

export class AssignPermissionDto {
  @IsNotEmpty()
  roleId: number;

  @IsNotEmpty()
  permissionId: number;

  @IsOptional()
  @IsBoolean()
  isGranted?: boolean = true;
}
