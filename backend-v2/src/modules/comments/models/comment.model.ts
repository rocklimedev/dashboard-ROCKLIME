import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

export enum ResourceType {
  ORDER = 'Order',
  PRODUCT = 'Product',
  CUSTOMER = 'Customer',
}

export interface CommentModel extends Model<CommentDocument> {
  hasReachedCommentLimit(
    resourceId: string,
    resourceType: string,
    userId: string,
  ): Promise<boolean>;
}

@Schema({
  collection: 'comments',
  timestamps: false,
})
export class Comment {
  @Prop({
    required: [true, 'Resource ID is required'],
    index: true,
  })
  resourceId: string;

  @Prop({
    required: [true, 'Resource type is required'],
    enum: Object.values(ResourceType),
    index: true,
  })
  resourceType: ResourceType;

  @Prop({
    required: [true, 'User ID is required'],
    index: true,
    ref: 'User',
  })
  userId: string;

  @Prop({
    required: [true, 'Comment text is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
  })
  comment: string;

  @Prop({
    default: Date.now,
  })
  createdAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Compound index
CommentSchema.index({
  resourceId: 1,
  resourceType: 1,
  userId: 1,
});

// Static method
CommentSchema.statics.hasReachedCommentLimit = async function (
  resourceId: string,
  resourceType: string,
  userId: string,
): Promise<boolean> {
  const userIdStr = String(userId).trim();

  const count = await this.countDocuments({
    resourceId,
    resourceType,
    userId: userIdStr,
  });

  return count >= 3;
};
