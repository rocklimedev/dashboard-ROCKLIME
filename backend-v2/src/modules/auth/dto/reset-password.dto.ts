// src/modules/auth/dto/reset-password.dto.ts
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsString() @IsNotEmpty() resetToken: string;
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() newPassword: string;
}
