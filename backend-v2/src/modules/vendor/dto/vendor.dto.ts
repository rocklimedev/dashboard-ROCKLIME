import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateVendorDto {
  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsNotEmpty()
  @IsString()
  vendorName: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsNumber()
  brandId?: number;
}

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsNumber()
  brandId?: number;
}
