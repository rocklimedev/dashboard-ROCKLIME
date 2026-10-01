import { Document } from 'mongoose';
export declare class QuotationVersionItem {
    productId: string;
    name: string;
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
    areaId: string;
    areaName: string;
    areaValue: string;
}
export declare class QuotationVersion extends Document {
    quotationId: string;
    version: number;
    quotationData: Record<string, any>;
    quotationItems: QuotationVersionItem[];
    floors: Record<string, any>[];
    totalFloors: number;
    updatedBy: string;
    updatedAt: Date;
}
export declare const QuotationVersionSchema: import("mongoose").Schema<QuotationVersion, import("mongoose").Model<QuotationVersion, any, any, any, Document<unknown, any, QuotationVersion, any, {}> & QuotationVersion & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, QuotationVersion, Document<unknown, {}, import("mongoose").FlatRecord<QuotationVersion>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<QuotationVersion> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
