// src/modules/categories/dto/create-parent-category.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateParentCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}
