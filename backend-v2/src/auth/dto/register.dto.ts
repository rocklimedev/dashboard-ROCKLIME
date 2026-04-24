import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsOptional()
  name?: string;

  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit Indian number',
  })
  mobileNumber?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password!: string;
}