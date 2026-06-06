import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
})
export class RefreshToken {
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
    index: true,
  })
  expiresAt: Date;

  createdAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// TTL Index (equivalent to expires: '0')
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
