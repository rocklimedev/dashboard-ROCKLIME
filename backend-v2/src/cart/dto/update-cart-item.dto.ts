// src/carts/dto/update-cart-item.dto.ts
import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  discount?: number;

  @IsOptional()
  tax?: number;
}