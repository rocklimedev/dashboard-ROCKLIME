// src/carts/dto/add-to-cart.dto.ts
import { IsUUID, IsArray, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  discount?: number;

  @IsOptional()
  tax?: number;
}

export class AddToCartDto {
  @IsUUID()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsUUID()
  @IsOptional()
  customerId?: string;
}