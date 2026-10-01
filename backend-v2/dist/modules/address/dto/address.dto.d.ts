export declare class CreateAddressDto {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    status?: string;
    userId?: string;
    customerId?: string;
}
export declare class UpdateAddressDto extends CreateAddressDto {
}
