import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class VerificationToken extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  token: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ required: true, index: true, expires: 0 })
  expiresAt: Date;
}

export const VerificationTokenSchema =
  SchemaFactory.createForClass(VerificationToken);
