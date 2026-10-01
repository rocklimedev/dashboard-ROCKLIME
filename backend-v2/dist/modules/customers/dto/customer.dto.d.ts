declare const CUSTOMER_TYPES: string[];
declare const GENDERS: string[];
export declare class CreateCustomerDto {
    name: string;
    email?: string;
    mobileNumber?: string;
    phone2?: string;
    companyName?: string;
    customerType?: string;
    gender?: string;
    address?: Record<string, any>;
    isVendor?: boolean;
    vendorId?: string;
    gstNumber?: string;
}
export declare class UpdateCustomerDto extends CreateCustomerDto {
}
export { CUSTOMER_TYPES, GENDERS };
