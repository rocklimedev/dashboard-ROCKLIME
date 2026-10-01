export declare class CreateFgsDto {
    vendorId: string;
    items: any[];
    expectDeliveryDate?: string;
}
export declare class UpdateFgsDto {
    vendorId?: string;
    items?: any[];
    status?: string;
    expectDeliveryDate?: string;
}
export declare class UpdateFgsStatusDto {
    status: string;
}
export declare class CreatePurchaseOrderDto {
    vendorId: string;
    items: any[];
    expectDeliveryDate?: string;
    fgsId?: string;
}
export declare class UpdatePurchaseOrderDto {
    vendorId?: string;
    items?: any[];
    status?: string;
    expectDeliveryDate?: string;
}
export declare class UpdatePurchaseOrderStatusDto {
    status: string;
}
