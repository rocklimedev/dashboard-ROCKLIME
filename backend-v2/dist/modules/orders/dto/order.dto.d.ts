export declare class CreateOrderDto {
    products: any[];
    createdFor: string;
    quotationId?: string;
    shipTo?: string;
    assignedUserId?: string;
    assignedTeamId?: string;
    secondaryUserId?: string;
    priority?: string;
    dueDate?: string;
    description?: string;
    source?: string;
    shipping?: number | string;
    gst?: number | string;
    extraDiscount?: number | string;
    extraDiscountType?: string;
}
export declare class UpdateOrderStatusDto {
    status: string;
    remarks?: string;
}
export declare class AddCommentDto {
    message: string;
}
