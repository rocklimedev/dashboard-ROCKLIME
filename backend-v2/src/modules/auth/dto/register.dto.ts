// src/modules/auth/dto/register.dto.ts
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMobilePhone,
} from 'class-validator';

export class RegisterDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsOptional() @IsMobilePhone() mobileNumber?: string;
  @IsString() @IsNotEmpty() password: string;
}
