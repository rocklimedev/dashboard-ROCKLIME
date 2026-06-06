import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VerificationTokenDocument = HydratedDocument<VerificationToken>;

@Schema({
  timestamps: true,
})
export class VerificationToken {
  @Prop({
    required: true,
    index: true,
  })
  userId: string;

  @Prop({
    required: true,
    index: true,
  })
  token: string;

  @Prop({
    required: true,
  })
  email: string;

  @Prop({
    default: false,
  })
  isVerified: boolean;

  @Prop({
    required: true,
    index: true,
  })
  expiresAt: Date;
}

export const VerificationTokenSchema =
  SchemaFactory.createForClass(VerificationToken);

// TTL Index (equivalent to:
// verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }))
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
