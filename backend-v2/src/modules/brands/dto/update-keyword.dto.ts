// src/modules/categories/dto/update-keyword.dto.ts
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateKeywordDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
