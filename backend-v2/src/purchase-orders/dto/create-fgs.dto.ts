// src/field-guided-sheets/dto/create-fgs.dto.ts
import { IsUUID, IsArray, IsNotEmpty, IsOptional, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FgsItemDto {
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

export class CreateFieldGuidedSheetDto {
  @IsUUID()
  vendorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FgsItemDto)
  items: FgsItemDto[];

  @IsOptional()
  @IsDateString()
  expectDeliveryDate?: string;
}