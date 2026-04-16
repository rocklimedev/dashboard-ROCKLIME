// src/brands/dto/create-brand.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  brandName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  brandSlug: string;
}