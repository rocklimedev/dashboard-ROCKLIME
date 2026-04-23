import {
  IsUUID,
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tax?: number;
}

export class AddToCartDto {
  // ❌ REMOVE userId (get from JWT instead)

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @IsUUID()
  @IsOptional()
  customerId?: string;
}