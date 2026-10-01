import { Document } from 'mongoose';
export declare class PoLineItem {
    productId: string;
    productName: string;
    productCode: string;
    companyCode: string;
    imageUrl: string;
    quantity: number;
    unitPrice: number;
    mrp: number;
    discount: number;
    discountType: string;
    tax: number;
    total: number;
}
export declare class FgsItem extends Document {
    fgsId: string;
    fgsNumber: string;
    vendorId: string;
    items: PoLineItem[];
    calculatedTotal: number;
}
export declare const FgsItemSchema: import("mongoose").Schema<FgsItem, import("mongoose").Model<FgsItem, any, any, any, Document<unknown, any, FgsItem, any, {}> & FgsItem & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FgsItem, Document<unknown, {}, import("mongoose").FlatRecord<FgsItem>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<FgsItem> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
