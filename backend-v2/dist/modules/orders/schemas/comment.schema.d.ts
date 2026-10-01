import { Document } from 'mongoose';
export declare class CommentUserSnapshot {
    userId: string;
    name: string;
    username: string;
}
export declare class Comment extends Document {
    resourceType: string;
    resourceId: string;
    userId: string;
    userSnapshot: CommentUserSnapshot;
    message: string;
}
export declare const CommentSchema: import("mongoose").Schema<Comment, import("mongoose").Model<Comment, any, any, any, Document<unknown, any, Comment, any, {}> & Comment & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Comment, Document<unknown, {}, import("mongoose").FlatRecord<Comment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Comment> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
