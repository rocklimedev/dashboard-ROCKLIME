import { Document } from 'mongoose';
export declare class OrderItemLine {
    productId: string;
    name: string;
    imageUrl: string;
    productCode: string;
    quantity: number;
    dispatchedQuantity: number;
    price: number;
    discount: number;
    discountType: string;
    tax: number;
    total: number;
}
export declare class OrderItem extends Document {
    orderId: string;
    items: OrderItemLine[];
}
export declare const OrderItemSchema: import("mongoose").Schema<OrderItem, import("mongoose").Model<OrderItem, any, any, any, Document<unknown, any, OrderItem, any, {}> & OrderItem & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OrderItem, Document<unknown, {}, import("mongoose").FlatRecord<OrderItem>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<OrderItem> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
