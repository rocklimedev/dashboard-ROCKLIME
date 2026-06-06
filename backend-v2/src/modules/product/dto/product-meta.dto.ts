import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

const validFieldTypes = [
  'string',
  'number',
  'mm',
  'inch',
  'pcs',
  'box',
  'feet',
];

export class CreateProductMetaDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(validFieldTypes)
  fieldType: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

export class UpdateProductMetaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(validFieldTypes)
  fieldType?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
