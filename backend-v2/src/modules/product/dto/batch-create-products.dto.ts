import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BatchProductItemDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() product_code: string;
  @IsOptional() quantity?: number | string;
  @IsOptional() price?: number | string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() meta?: Record<string, any>;
}

export class BatchCreateProductsDto {
  @IsNotEmpty() @IsUUID() categoryId: string;
  @IsNotEmpty() @IsUUID() brandId: string;
  @IsOptional() @IsUUID() vendorId?: string;
  @IsOptional() @IsUUID() brand_parentcategoriesId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BatchProductItemDto)
  products: BatchProductItemDto[];
}
