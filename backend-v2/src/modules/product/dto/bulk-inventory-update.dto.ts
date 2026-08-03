import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class InventoryUpdateItemDto {
  @IsOptional() @IsString() company_code?: string;
  @IsOptional() @IsString() product_code?: string;

  @IsNumber() @IsPositive() quantity: number;

  @IsOptional() @IsString() warehouse?: string;
  @IsOptional() @IsNumber() selling_price?: number;
  @IsOptional() @IsString() message?: string;
  @IsOptional() @IsUUID() userId?: string;
}

export class BulkInventoryUpdateDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => InventoryUpdateItemDto)
  updates: InventoryUpdateItemDto[];
}
