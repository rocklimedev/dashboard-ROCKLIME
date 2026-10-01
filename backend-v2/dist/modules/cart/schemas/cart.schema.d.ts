import { Document } from 'mongoose';
export declare class CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    discount: number;
    tax: number;
    total: number;
}
export declare class Cart extends Document {
    customerId?: string;
    userId: string;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const CartSchema: import("mongoose").Schema<Cart, import("mongoose").Model<Cart, any, any, any, Document<unknown, any, Cart, any, {}> & Cart & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Cart, Document<unknown, {}, import("mongoose").FlatRecord<Cart>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Cart> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
