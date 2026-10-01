import { IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQuotationDto {
  @IsArray()
  products: any[];

  @IsOptional()
  @IsArray()
  floors?: any[];

  @IsOptional()
  extraDiscount?: number | string;

  @IsOptional()
  @IsIn(['percent', 'fixed'])
  extraDiscountType?: string;

  @IsOptional()
  shippingAmount?: number | string;

  @IsOptional()
  gst?: number | string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsString()
  quotation_date?: string;

  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @IsString()
  document_title?: string;

  @IsOptional()
  @IsUUID()
  shipTo?: string;

  @IsOptional()
  @IsString()
  signature_name?: string;

  @IsOptional()
  @IsString()
  signature_image?: string;
}

export class UpdateQuotationDto extends CreateQuotationDto {
  @IsOptional()
  @IsArray()
  followupDates?: string[];
}
