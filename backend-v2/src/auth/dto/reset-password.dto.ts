import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEmail,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword!: string;

  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}