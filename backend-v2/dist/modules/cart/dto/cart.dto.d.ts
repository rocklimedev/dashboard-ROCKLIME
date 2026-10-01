export declare class AddProductToCartDto {
    userId: string;
    productId: string;
    quantity?: number;
}
export declare class CartItemInput {
    productId: string;
    quantity: number;
    discount?: number;
    tax?: number;
}
export declare class AddToCartDto {
    userId: string;
    customerId?: string;
    items: CartItemInput[];
}
export declare class RemoveFromCartDto {
    userId: string;
    productId: string;
}
export declare class UpdateCartDto {
    userId: string;
    productId: string;
    quantity: number;
    discount?: number;
    tax?: number;
}
export declare class ClearCartDto {
    userId: string;
}
export declare class ConvertQuotationToCartDto {
    userId: string;
    quotationId: string;
}
