import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class CommentUserSnapshot {
  @Prop() userId: string;
  @Prop() name: string;
  @Prop() username: string;
}
const CommentUserSnapshotSchema = SchemaFactory.createForClass(CommentUserSnapshot);

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ required: true, index: true })
  resourceType: string; // e.g. "ORDER"

  @Prop({ required: true, index: true })
  resourceId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: CommentUserSnapshotSchema })
  userSnapshot: CommentUserSnapshot;

  @Prop({ required: true })
  message: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
