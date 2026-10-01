import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

const CUSTOMER_TYPES = ['Retail', 'Architect', 'Interior', 'Builder', 'Contractor'];
const GENDERS = ['Male', 'Female', 'Other'];

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  phone2?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  customerType?: string;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  address?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isVendor?: boolean;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;
}

export class UpdateCustomerDto extends CreateCustomerDto {}

export { CUSTOMER_TYPES, GENDERS };
