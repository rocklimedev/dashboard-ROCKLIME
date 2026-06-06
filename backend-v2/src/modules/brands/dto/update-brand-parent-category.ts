// src/modules/brands/dto/update-brand-parent-category.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateBrandParentCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;
}
