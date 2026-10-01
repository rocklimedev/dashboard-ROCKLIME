import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { FGS_STATUSES } from '../entities/fgs.entity';
import { PO_STATUSES } from '../entities/purchase-order.entity';

export class CreateFgsDto {
  @IsUUID()
  vendorId: string;

  @IsArray()
  items: any[];

  @IsOptional()
  @IsString()
  expectDeliveryDate?: string;
}

export class UpdateFgsDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsArray()
  items?: any[];

  @IsOptional()
  @IsIn(FGS_STATUSES as unknown as string[])
  status?: string;

  @IsOptional()
  @IsString()
  expectDeliveryDate?: string;
}

export class UpdateFgsStatusDto {
  @IsIn(FGS_STATUSES as unknown as string[])
  status: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  vendorId: string;

  @IsArray()
  items: any[];

  @IsOptional()
  @IsString()
  expectDeliveryDate?: string;

  @IsOptional()
  @IsUUID()
  fgsId?: string;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsArray()
  items?: any[];

  @IsOptional()
  @IsIn(PO_STATUSES as unknown as string[])
  status?: string;

  @IsOptional()
  @IsString()
  expectDeliveryDate?: string;
}

export class UpdatePurchaseOrderStatusDto {
  @IsIn(PO_STATUSES as unknown as string[])
  status: string;
}
