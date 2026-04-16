// src/customers/dto/create-customer.dto.ts
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { CustomerType } from '../entities/customer.entity';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  phone2?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @IsString()
  @IsOptional()
  gstNumber?: string;

  @IsBoolean()
  @IsOptional()
  isVendor?: boolean;

  @IsString()
  @IsOptional()
  vendorId?: string;
}