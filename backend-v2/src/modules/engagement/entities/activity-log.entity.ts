import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

export const CONTEXT_TAGS = {
  AUTH: 'AUTH',
  CRM: 'CRM',
  CATALOG: 'CATALOG',
  SALES: 'SALES',
  PROCUREMENT: 'PROCUREMENT',
  INVENTORY: 'INVENTORY',
  SYSTEM: 'SYSTEM',
} as const;

export const SUB_CONTEXTS = {
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  BRAND: 'BRAND',
  CATEGORY: 'CATEGORY',
  PRODUCT: 'PRODUCT',
  QUOTATION: 'QUOTATION',
  ORDER: 'ORDER',
  FIELD_GUIDED_SHEET: 'FIELD_GUIDED_SHEET',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  TEAM: 'TEAM',
  ADDRESS: 'ADDRESS',
  // NOTE: legacy modules/rbac/role.controller.js logs activity with
  // subContext: "ROLE", but the original activity-log.model.js SUB_CONTEXTS
  // enum never defined ROLE - every one of those calls would have failed
  // Sequelize's ENUM validation at the DB level and been silently swallowed
  // by logActivity's try/catch. Added here so role-management activity is
  // actually recorded correctly instead of silently dropped.
  ROLE: 'ROLE',
} as const;

@Table({
  tableName: 'activity_logs',
  timestamps: true,
  indexes: [
    { name: 'idx_activity_logs_user_id', fields: ['userId'] },
    { name: 'idx_activity_logs_context_tag', fields: ['contextTag'] },
    { name: 'idx_activity_logs_sub_context', fields: ['subContext'] },
    { name: 'idx_activity_logs_entity_id', fields: ['entityId'] },
    { name: 'idx_activity_logs_action', fields: ['action'] },
    { name: 'idx_activity_logs_severity', fields: ['severity'] },
    { name: 'idx_activity_logs_created_at', fields: ['createdAt'] },
    {
      name: 'idx_activity_logs_context_subcontext',
      fields: ['contextTag', 'subContext'],
    },
  ],
})
export class ActivityLog extends Model<ActivityLog> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  })
  activityLogId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  userId: string;

  @Column({ type: DataType.ENUM(...Object.values(CONTEXT_TAGS)), allowNull: false })
  contextTag: string;

  @Column({ type: DataType.ENUM(...Object.values(SUB_CONTEXTS)), allowNull: false })
  subContext: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  action: string;

  @Column({ type: DataType.UUID, allowNull: true })
  entityId: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  entityName: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({
    type: DataType.ENUM('info', 'warning', 'error', 'critical'),
    allowNull: false,
    defaultValue: 'info',
  })
  severity: string;

  @Column({ type: DataType.JSON, allowNull: true })
  oldValues: Record<string, any>;

  @Column({ type: DataType.JSON, allowNull: true })
  newValues: Record<string, any>;

  @Column({ type: DataType.JSON, allowNull: true })
  metadata: Record<string, any>;

  @Column({ type: DataType.STRING(50), allowNull: true })
  ipAddress: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  userAgent: string;
}
