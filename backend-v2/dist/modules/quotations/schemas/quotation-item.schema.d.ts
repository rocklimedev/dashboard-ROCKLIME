import { Document } from 'mongoose';
export declare class QuotationItemLine {
    productId: string;
    name: string;
    parentProductId: string;
    imageUrl: string;
    productCode: string;
    companyCode: string;
    quantity: number;
    price: number;
    discount: number;
    discountType: string;
    tax: number;
    total: number;
    isOptionFor: string;
    optionType: string;
    groupId: string;
    floorId: string;
    floorName: string;
    roomId: string;
    roomName: string;
    priority: number;
    areaId: string;
    areaName: string;
    areaValue: string;
}
export declare class QuotationItem extends Document {
    quotationId: string;
    items: QuotationItemLine[];
}
export declare const QuotationItemSchema: import("mongoose").Schema<QuotationItem, import("mongoose").Model<QuotationItem, any, any, any, Document<unknown, any, QuotationItem, any, {}> & QuotationItem & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, QuotationItem, Document<unknown, {}, import("mongoose").FlatRecord<QuotationItem>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<QuotationItem> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
