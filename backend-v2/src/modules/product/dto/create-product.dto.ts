import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() product_code?: string;
  @IsOptional() quantity?: number | string;

  @IsOptional() isMaster?: boolean | string;
  @IsOptional() @IsUUID() masterProductId?: string;
  @IsOptional() variantOptions?: string | Record<string, any>;
  @IsOptional() @IsString() variantKey?: string;
  @IsOptional() @IsString() skuSuffix?: string;

  // Sent as a JSON string from multipart form-data, or an object from JSON body.
  @IsOptional() meta?: string | Record<string, any>;

  @IsOptional() isFeatured?: boolean | string;
  @IsOptional()
  @IsIn(['active', 'out_of_stock', 'inactive', 'draft'])
  status?: string;

  // Array, or comma-separated string from multipart form-data.
  @IsOptional() keywordIds?: string[] | string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() tax?: number | string;
  @IsOptional() alert_quantity?: number | string;

  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() brandId?: string;
  @IsOptional() @IsUUID() vendorId?: string;
  @IsOptional() @IsUUID() brand_parentcategoriesId?: string;
}
