export interface QuotationLineItem {
    price?: number;
    quantity?: number;
    discount?: number;
    discountType?: 'percent' | 'fixed';
    isOption?: boolean;
    isOptionFor?: string | null;
    optionType?: string | null;
}
export declare function calculateTotals(items?: QuotationLineItem[], extraDiscount?: number, extraDiscountType?: 'percent' | 'fixed', shippingAmount?: number, gst?: number): {
    subTotal: number;
    totalItemDiscount: number;
    taxableAmount: number;
    extraDiscountAmount: number;
    shippingAmount: number;
    amountBeforeGst: number;
    roundOff: number;
    gstAmount: number;
    finalAmount: number;
    optionalItems: QuotationLineItem[];
    optionalTotal: number;
    optionalItemsCount: number;
};
