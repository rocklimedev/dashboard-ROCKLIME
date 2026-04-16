// src/orders/dto/create-order.dto.ts
import { IsArray, ValidateNested, IsEnum, IsOptional, IsUUID, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, Priority } from '../entities/order.entity';

class OrderProductDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  discount?: number = 0;

  @IsString()
  @IsOptional()
  discountType?: 'percent' | 'fixed' = 'percent';

  @IsNumber()
  @IsOptional()
  tax?: number = 0;
}

export class CreateOrderDto {
  @IsUUID()
  createdFor: string; // customerId

  @IsUUID()
  createdBy: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[];

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus = OrderStatus.DRAFT;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority = Priority.MEDIUM;

  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  shipping?: number = 0;

  @IsNumber()
  @IsOptional()
  gst?: number;

  @IsNumber()
  @IsOptional()
  extraDiscount?: number;

  @IsString()
  @IsOptional()
  extraDiscountType?: 'percent' | 'fixed';

  @IsNumber()
  @IsOptional()
  amountPaid?: number = 0;

  @IsUUID()
  @IsOptional()
  quotationId?: string;

  @IsUUID()
  @IsOptional()
  shipTo?: string;

  @IsUUID()
  @IsOptional()
  assignedTeamId?: string;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;

  @IsUUID()
  @IsOptional()
  secondaryUserId?: string;

  @IsOptional()
  followupDates?: string[];

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  masterPipelineNo?: string;

  @IsUUID()
  @IsOptional()
  previousOrderNo?: string;
}