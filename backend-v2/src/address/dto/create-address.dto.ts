import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { AddressStatus } from '../entities/address.entity';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @ValidateIf((o: CreateAddressDto) => o.customerId == null)
  @IsUUID()
  @IsNotEmpty()
  userId?: string;

  @ValidateIf((o: CreateAddressDto) => o.userId == null)
  @IsUUID()
  @IsNotEmpty()
  customerId?: string;

  @IsEnum(AddressStatus)
  @IsOptional()
  status?: AddressStatus;
}
