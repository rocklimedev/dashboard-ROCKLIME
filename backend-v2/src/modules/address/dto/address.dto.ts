import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsIn(['BILLING', 'PRIMARY', 'ADDITIONAL'])
  status?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class UpdateAddressDto extends CreateAddressDto {}
