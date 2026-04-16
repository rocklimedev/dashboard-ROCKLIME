// src/users/dto/create-user.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsUUID, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { UserStatus, BloodGroup } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(BloodGroup)
  @IsOptional()
  bloodGroup?: BloodGroup;

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
  isEmailVerified?: boolean = false;
}