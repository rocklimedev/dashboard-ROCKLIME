import { Document } from 'mongoose';
import { PoLineItem } from './fgs-item.schema';
export declare class PoItem extends Document {
    poId: string;
    poNumber: string;
    vendorId: string;
    items: PoLineItem[];
    calculatedTotal: number;
}
export declare const PoItemSchema: import("mongoose").Schema<PoItem, import("mongoose").Model<PoItem, any, any, any, Document<unknown, any, PoItem, any, {}> & PoItem & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PoItem, Document<unknown, {}, import("mongoose").FlatRecord<PoItem>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PoItem> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
