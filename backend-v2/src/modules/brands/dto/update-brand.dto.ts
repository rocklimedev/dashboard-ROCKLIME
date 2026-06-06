// src/modules/brands/dto/update-brand.dto.ts
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  logo?: string;
}
