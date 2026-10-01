export declare class CreateQuotationDto {
    products: any[];
    floors?: any[];
    extraDiscount?: number | string;
    extraDiscountType?: string;
    shippingAmount?: number | string;
    gst?: number | string;
    customerId: string;
    quotation_date?: string;
    due_date?: string;
    document_title?: string;
    shipTo?: string;
    signature_name?: string;
    signature_image?: string;
}
export declare class UpdateQuotationDto extends CreateQuotationDto {
    followupDates?: string[];
}
