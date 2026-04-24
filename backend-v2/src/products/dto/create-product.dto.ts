import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  product_code?: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number = 0;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isMaster?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  masterProductId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  variantOptions?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  variantKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  skuSuffix?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  meta?: Record<string, any>;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  keywordIds?: string[] = [];

  // Other fields
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  alert_quantity?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsUUID()
  brand_parentcategoriesId?: string;
}
