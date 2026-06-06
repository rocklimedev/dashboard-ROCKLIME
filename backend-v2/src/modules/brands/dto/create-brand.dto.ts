// src/modules/brands/dto/create-brand.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  brandName: string;

  @IsString()
  @IsNotEmpty()
  brandSlug: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  logo?: string;
}
