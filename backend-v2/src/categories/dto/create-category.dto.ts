import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  brandId!: string;

  @IsUUID()
  @IsOptional() // ✅ make optional if top-level category allowed
  parentCategoryId?: string;

  @IsArray()
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keywords?: string[];
}