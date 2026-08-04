import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProductInputDto } from './product-input.dto';
import { FloorInputDto } from './floor-input.dto';

export class CreateQuotationDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product is required' })
  @ValidateNested({ each: true })
  @Type(() => ProductInputDto)
  products: ProductInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FloorInputDto)
  floors?: FloorInputDto[];

  @IsOptional()
  @IsNumber()
  extraDiscount?: number = 0;

  @IsOptional()
  @IsIn(['percent', 'flat'])
  extraDiscountType?: 'percent' | 'flat' = 'percent';

  @IsOptional()
  @IsNumber()
  shippingAmount?: number = 0;

  @IsOptional()
  @IsNumber()
  gst?: number = 0;

  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  quotation_date?: string;

  @IsOptional()
  @IsString()
  due_date?: string | null;

  @IsOptional()
  @IsString()
  document_title?: string = 'Quotation';

  @IsOptional()
  @IsString()
  shipTo?: string;

  @IsOptional()
  @IsString()
  signature_name?: string = '';

  @IsOptional()
  @IsString()
  signature_image?: string = '';

  // Any additional Quotation model columns not explicitly modeled above
  // (kept loose intentionally — mirrors the original controller's `...rest`).
  [extra: string]: unknown;
}
