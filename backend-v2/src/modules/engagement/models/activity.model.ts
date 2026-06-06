import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { User } from '@/modules/users/entities/user.entity';

export enum ContextTags {
  AUTH = 'AUTH',
  CRM = 'CRM',
  CATALOG = 'CATALOG',
  SALES = 'SALES',
  PROCUREMENT = 'PROCUREMENT',
  INVENTORY = 'INVENTORY',
  SYSTEM = 'SYSTEM',
}

export enum SubContexts {
  USER = 'USER',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',

  BRAND = 'BRAND',
  CATEGORY = 'CATEGORY',
  PRODUCT = 'PRODUCT',

  QUOTATION = 'QUOTATION',
  ORDER = 'ORDER',

  FIELD_GUIDED_SHEET = 'FIELD_GUIDED_SHEET',
  PURCHASE_ORDER = 'PURCHASE_ORDER',

  TEAM = 'TEAM',
  ADDRESS = 'ADDRESS',
}

export enum ActivitySeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

@Table({
  tableName: 'activity_logs',
  timestamps: true,
  indexes: [
    {
      name: 'idx_activity_logs_user_id',
      fields: ['userId'],
    },
    {
      name: 'idx_activity_logs_context_tag',
      fields: ['contextTag'],
    },
    {
      name: 'idx_activity_logs_sub_context',
      fields: ['subContext'],
    },
    {
      name: 'idx_activity_logs_entity_id',
      fields: ['entityId'],
    },
    {
      name: 'idx_activity_logs_action',
      fields: ['action'],
    },
    {
      name: 'idx_activity_logs_severity',
      fields: ['severity'],
    },
    {
      name: 'idx_activity_logs_created_at',
      fields: ['createdAt'],
    },
    {
      name: 'idx_activity_logs_context_subcontext',
      fields: ['contextTag', 'subContext'],
    },
  ],
})
export class ActivityLog extends Model<ActivityLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  activityLogId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId: string;

  @Column({
    type: DataType.ENUM(...Object.values(ContextTags)),
    allowNull: false,
  })
  contextTag: ContextTags;

  @Column({
    type: DataType.ENUM(...Object.values(SubContexts)),
    allowNull: false,
  })
  subContext: SubContexts;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  action: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  entityId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  entityName: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Default(ActivitySeverity.INFO)
  @Column({
    type: DataType.ENUM(
      ActivitySeverity.INFO,
      ActivitySeverity.WARNING,
      ActivitySeverity.ERROR,
      ActivitySeverity.CRITICAL,
    ),
    allowNull: false,
  })
  severity: ActivitySeverity;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  oldValues: Record<string, any>;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  newValues: Record<string, any>;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata: Record<string, any>;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  ipAddress: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  userAgent: string;

  // -----------------------------
  // Associations
  // -----------------------------

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  user: User;
}
