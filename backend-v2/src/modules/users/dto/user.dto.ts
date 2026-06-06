import {
  IsString,
  IsEmail,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ROLES } from '../config/constant';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsUUID()
  roleId: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @IsString()
  @IsOptional()
  emergencyNumber?: string;

  @IsString()
  @IsOptional()
  shiftFrom?: string;

  @IsString()
  @IsOptional()
  shiftTo?: string;

  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @IsString()
  @IsOptional()
  emergencyNumber?: string;

  @IsString()
  @IsOptional()
  shiftFrom?: string;

  @IsString()
  @IsOptional()
  shiftTo?: string;

  @IsOptional()
  address?: any;

  @IsString()
  @IsOptional()
  photo_thumbnail?: string;

  @IsString()
  @IsOptional()
  photo_original?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @IsString()
  @IsOptional()
  emergencyNumber?: string;

  @IsString()
  @IsOptional()
  shiftFrom?: string;

  @IsString()
  @IsOptional()
  shiftTo?: string;

  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsEnum(['active', 'inactive', 'restricted'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @IsString()
  @IsOptional()
  about?: string;
}

export class UpdateStatusDto {
  @IsEnum(['active', 'inactive', 'restricted'])
  status: string;
}

export class AssignRoleDto {
  @IsUUID()
  roleId: string;
}
