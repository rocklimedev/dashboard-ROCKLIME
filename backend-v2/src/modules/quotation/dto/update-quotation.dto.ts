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

export class UpdateQuotationDto {
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
  @IsArray()
  followupDates?: string[] = [];

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

  // Remaining Quotation columns the caller might patch (status, shipTo, etc.)
  [extra: string]: unknown;
}
