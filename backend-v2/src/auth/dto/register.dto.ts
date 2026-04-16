// src/auth/dto/register.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDto {
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
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}