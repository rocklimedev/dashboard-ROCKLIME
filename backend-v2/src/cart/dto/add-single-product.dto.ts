// src/carts/dto/add-single-product.dto.ts
import { IsUUID, IsInt, Min } from 'class-validator';

export class AddSingleProductDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity?: number = 1;
}