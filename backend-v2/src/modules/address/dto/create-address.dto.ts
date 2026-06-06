// src/modules/addresses/dto/create-address.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { AddressStatus } from '../models/address.model';
export class CreateAddressDto {
  @IsString() @IsNotEmpty() street: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() state: string;
  @IsString() @IsOptional() postalCode?: string;
  @IsString() @IsNotEmpty() country: string;

  @IsUUID() @IsOptional() userId?: string;
  @IsUUID() @IsOptional() customerId?: string;
  @IsEnum(AddressStatus) @IsOptional() status?: AddressStatus;
}
