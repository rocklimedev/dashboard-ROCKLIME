import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CachedPermissionDocument = HydratedDocument<CachedPermission>;

@Schema({ _id: false })
export class PermissionItem {
  @Prop()
  permissionId: string;

  @Prop()
  name: string;

  @Prop()
  api: string;

  @Prop()
  route: string;

  @Prop()
  module: string;
}

export const PermissionItemSchema =
  SchemaFactory.createForClass(PermissionItem);

@Schema({
  timestamps: true,
  collection: 'cached_permissions',
})
export class CachedPermission {
  @Prop({
    required: true,
    index: true,
  })
  userId: string;

  @Prop({
    required: true,
    index: true,
  })
  roleId: string;

  @Prop()
  roleName: string;

  @Prop({
    type: [PermissionItemSchema],
    default: [],
  })
  permissions: PermissionItem[];

  @Prop({
    default: Date.now,
    index: true,
  })
  fetchedAt: Date;
}

export const CachedPermissionSchema =
  SchemaFactory.createForClass(CachedPermission);

// -----------------------------------
// Indexes
// -----------------------------------

// TTL index (auto delete after 24 hours)
CachedPermissionSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 86400 });

// Unique user-role combo
CachedPermissionSchema.index({ userId: 1, roleId: 1 }, { unique: true });
