import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBrandDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  brandName!: string;

  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  brandSlug!: string;
}