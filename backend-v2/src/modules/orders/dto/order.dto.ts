import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ORDER_STATUSES } from '../entities/order.entity';

export class CreateOrderDto {
  @IsArray()
  products: any[];

  @IsUUID()
  createdFor: string;

  @IsOptional()
  @IsUUID()
  quotationId?: string;

  @IsOptional()
  @IsUUID()
  shipTo?: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  assignedTeamId?: string;

  @IsOptional()
  @IsUUID()
  secondaryUserId?: string;

  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  priority?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  shipping?: number | string;

  @IsOptional()
  gst?: number | string;

  @IsOptional()
  extraDiscount?: number | string;

  @IsOptional()
  @IsIn(['percent', 'fixed'])
  extraDiscountType?: string;
}

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES as unknown as string[])
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AddCommentDto {
  @IsString()
  message: string;
}
