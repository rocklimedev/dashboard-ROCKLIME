import { Document } from 'mongoose';
export declare class VerificationToken extends Document {
    userId: string;
    token: string;
    email: string;
    isVerified: boolean;
    expiresAt: Date;
}
export declare const VerificationTokenSchema: import("mongoose").Schema<VerificationToken, import("mongoose").Model<VerificationToken, any, any, any, Document<unknown, any, VerificationToken, any, {}> & VerificationToken & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VerificationToken, Document<unknown, {}, import("mongoose").FlatRecord<VerificationToken>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<VerificationToken> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
