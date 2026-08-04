import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchProductsDto {
  @IsOptional() @IsString() q?: string; // used by the frontend's useSearchProductsQuery
  @IsOptional() @IsString() query?: string; // kept for backward compatibility

  @IsOptional() @IsString() name?: string;
  @IsOptional() sellingPrice?: number | string;
  @IsOptional() minSellingPrice?: number | string;
  @IsOptional() maxSellingPrice?: number | string;
  @IsOptional() purchasingPrice?: number | string;
  @IsOptional() minPurchasingPrice?: number | string;
  @IsOptional() maxPurchasingPrice?: number | string;

  @IsOptional() @IsString() companyCode?: string;
  @IsOptional() @IsString() productCode?: string;
  @IsOptional() @IsUUID() brandId?: string;
  @IsOptional() @IsUUID() categoryId?: string;
}
