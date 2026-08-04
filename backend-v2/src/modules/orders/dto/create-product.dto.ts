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
import { OrderProductDto } from './order-product.dto';

export class CreateOrderDto {
  @IsString()
  createdFor: string;

  @IsString()
  createdBy: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assignedTeamId?: string;

  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  secondaryUserId?: string;

  @IsOptional()
  @IsArray()
  followupDates?: string[];

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  priority?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  quotationId?: string;

  @IsOptional()
  @IsString()
  masterPipelineNo?: string;

  @IsOptional()
  @IsString()
  previousOrderNo?: string;

  @IsOptional()
  @IsString()
  shipTo?: string;

  @IsOptional()
  @IsNumber()
  shipping?: number = 0;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsNumber()
  gst?: number;

  @IsOptional()
  @IsNumber()
  extraDiscount?: number;

  @IsOptional()
  @IsIn(['fixed', 'percent'])
  extraDiscountType?: 'fixed' | 'percent' = 'fixed';

  @IsOptional()
  @IsNumber()
  amountPaid?: number = 0;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[];
}
