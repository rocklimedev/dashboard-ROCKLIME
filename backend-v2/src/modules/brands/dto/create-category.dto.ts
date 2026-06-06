// src/modules/categories/dto/create-category.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  brandId: string;

  @IsUUID()
  @IsNotEmpty()
  parentCategoryId: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];
}
