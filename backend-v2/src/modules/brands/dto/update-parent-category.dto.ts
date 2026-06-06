// src/modules/categories/dto/update-parent-category.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateParentCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
