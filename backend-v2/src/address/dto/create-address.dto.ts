// src/addresses/dto/create-address.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, ValidateIf } from 'class-validator';
import { AddressStatus } from '../entities/address.entity';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => !o.customerId)
  userId?: string;

  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => !o.userId)
  customerId?: string;

  @IsEnum(AddressStatus)
  @IsOptional()
  status?: AddressStatus;
}