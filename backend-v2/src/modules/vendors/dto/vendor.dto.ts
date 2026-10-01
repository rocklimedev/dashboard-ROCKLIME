import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateVendorDto {
  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsString()
  vendorName: string;

  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;
}

export class UpdateVendorDto extends CreateVendorDto {}
