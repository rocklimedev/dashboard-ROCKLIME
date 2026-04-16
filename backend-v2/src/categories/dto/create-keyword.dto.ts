// src/keywords/dto/create-keyword.dto.ts
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateKeywordDto {
  @IsString()
  @IsNotEmpty()
  keyword: string;

  @IsUUID()
  categoryId: string;
}