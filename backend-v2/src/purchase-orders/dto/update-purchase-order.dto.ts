// src/purchase-orders/dto/update-purchase-order.dto.ts
import { PartialType, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { POStatus } from '../entities/purchase-order.entity';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';

class UpdatePoItemDto extends PartialType(CreatePurchaseOrderDto['items'][0]) {}

export class UpdatePurchaseOrderDto {
  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsEnum(POStatus)
  @IsOptional()
  status?: POStatus;

  @IsOptional()
  @IsDateString()
  expectDeliveryDate?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdatePoItemDto)
  items?: UpdatePoItemDto[];
}