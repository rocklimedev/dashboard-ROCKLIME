import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsPhoneNumber,
  Length,
} from 'class-validator';

export enum CustomerType {
  RETAIL = 'Retail',
  ARCHITECT = 'Architect',
  INTERIOR = 'Interior',
  BUILDER = 'Builder',
  CONTRACTOR = 'Contractor',
}

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('IN') // Adjust country code as needed
  mobileNumber?: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  phone2?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @Length(15, 15)
  gstNumber?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  mobileNumber?: string;

  @IsOptional()
  @IsPhoneNumber('IN')
  phone2?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @Length(15, 15)
  gstNumber?: string;
}
