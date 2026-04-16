// src/categories/dto/create-category.dto.ts
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsArray } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  brandId: string;

  @IsUUID()
  parentCategoryId: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];
}