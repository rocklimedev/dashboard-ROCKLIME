// src/users/dto/update-profile.dto.ts
import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';

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

  @IsObject()
  @IsOptional()
  address?: any;

  @IsString()
  @IsOptional()
  photo_thumbnail?: string;

  @IsString()
  @IsOptional()
  photo_original?: string;
}