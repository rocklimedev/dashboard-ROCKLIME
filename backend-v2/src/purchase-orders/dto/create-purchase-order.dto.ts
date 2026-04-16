// src/purchase-orders/dto/create-purchase-order.dto.ts
import { IsUUID, IsArray, IsNotEmpty, IsOptional, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PoItemDto {
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  unitPrice: number;

  @IsOptional()
  mrp?: number;

  @IsOptional()
  discount?: number;

  @IsOptional()
  discountType?: 'percent' | 'fixed';

  @IsOptional()
  tax?: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  vendorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoItemDto)
  items: PoItemDto[];

  @IsOptional()
  @IsDateString()
  expectDeliveryDate?: string;

  @IsUUID()
  @IsOptional()
  fgsId?: string;
}