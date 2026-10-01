import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  product_code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  isMaster?: boolean | string;

  @IsOptional()
  @IsUUID()
  masterProductId?: string;

  @IsOptional()
  variantOptions?: string | Record<string, any>;

  @IsOptional()
  @IsString()
  variantKey?: string;

  @IsOptional()
  @IsString()
  skuSuffix?: string;

  @IsOptional()
  meta?: string | Record<string, any>;

  @IsOptional()
  isFeatured?: boolean | string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'expired', 'out_of_stock', 'bulk_stocked'])
  status?: string;

  @IsOptional()
  @IsArray()
  keywordIds?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tax?: string | number;

  @IsOptional()
  alert_quantity?: string | number;

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

export class UpdateProductDto extends CreateProductDto {
  @IsOptional()
  imagesToDelete?: string | string[];
}

export class AddStockDto {
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class RemoveStockDto extends AddStockDto {}

export class UpdateFeaturedDto {
  @IsBoolean()
  isFeatured: boolean;
}

export class ProductIdsDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}

export class KeywordIdsDto {
  @IsArray()
  @IsString({ each: true })
  keywordIds: string[];
}
