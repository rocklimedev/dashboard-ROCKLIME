// src/vendors/dto/create-vendor.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsOptional()
  vendorId?: string; // can be empty → will be set to null

  @IsString()
  @IsNotEmpty()
  vendorName: string;

  @IsUUID()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  brandSlug?: string;
}