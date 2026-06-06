// src/modules/brands/dto/create-brand-parent-category.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBrandParentCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
