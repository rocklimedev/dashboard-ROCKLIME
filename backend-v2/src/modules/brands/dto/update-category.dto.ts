// src/modules/categories/dto/update-category.dto.ts
import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  brandId?: string;

  @IsUUID()
  @IsOptional()
  parentCategoryId?: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];
}
