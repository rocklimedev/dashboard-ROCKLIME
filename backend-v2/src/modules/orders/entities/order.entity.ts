import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { Address } from '../../address/entities/address.entity';
import { Quotation } from '../../quotations/entities/quotation.entity';
import { OrderDispatch } from './order-dispatch.entity';
import { OrderCreditNote } from './order-credit-note.entity';
import { OrderActivity } from './order-activity.entity';

export const ORDER_STATUSES = [
  'DRAFT',
  'PREPARING',
  'CHECKING',
  'INVOICE',
  'PARTIALLY_DISPATCHED',
  'DISPATCHED',
  'PARTIALLY_DELIVERED',
  'DELIVERED',
  'RETURNED',
  'ONHOLD',
  'CANCELED',
  'CLOSED',
] as const;

@Table({
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['orderNo'] },
    { fields: ['status'] },
    { fields: ['createdFor'] },
    { fields: ['createdBy'] },
    { fields: ['assignedUserId'] },
    { fields: ['dueDate'] },
    { fields: ['quotationId'] },
    { fields: ['finalAmount'] },
    { fields: ['createdAt'] },
    { name: 'idx_order_status_date', fields: ['status', 'createdAt'] },
  ],
})
export class Order extends Model<Order> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ type: DataType.STRING(30), allowNull: false, unique: true })
  orderNo: string;

  @Column({ type: DataType.JSON, allowNull: true })
  products: Record<string, any>[];

  @Column({
    type: DataType.ENUM(...ORDER_STATUSES),
    allowNull: false,
    defaultValue: 'DRAFT',
  })
  status: string;

  @Column({ type: DataType.ENUM('high', 'medium', 'low'), allowNull: false, defaultValue: 'medium' })
  priority: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  dueDate: string;

  @Column({ type: DataType.JSON, allowNull: true })
  followupDates: string[];

  @Column({ type: DataType.STRING(100), allowNull: true })
  source: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID, allowNull: false })
  createdFor: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  createdBy: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  assignedUserId: string;

  // NOTE: plain column, no @BelongsTo - Team model/module doesn't exist
  // yet (see docs/MIGRATION_PLAN.md)
  @Column({ type: DataType.UUID, allowNull: true })
  assignedTeamId: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  secondaryUserId: string;

  @ForeignKey(() => Quotation)
  @Column({ type: DataType.UUID, allowNull: true })
  quotationId: string;

  @ForeignKey(() => Address)
  @Column({ type: DataType.UUID, allowNull: true })
  shipTo: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  gatePassLink: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  invoiceLink: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  receivingDocumentLink: string;

  @Column({ type: DataType.STRING(30), allowNull: true })
  masterPipelineNo: string;

  @Column({ type: DataType.STRING(30), allowNull: true })
  previousOrderNo: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  shipping: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  gst: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  gstValue: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  extraDiscount: number;

  @Column({ type: DataType.ENUM('percent', 'fixed'), allowNull: true })
  extraDiscountType: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  extraDiscountValue: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  finalAmount: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  amountPaid: number;

  @BelongsTo(() => User, { foreignKey: 'secondaryUserId', as: 'secondaryUser' })
  secondaryUser: User;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  creator: User;

  @BelongsTo(() => User, { foreignKey: 'assignedUserId', as: 'assignedUser' })
  assignedUser: User;

  @BelongsTo(() => Customer, { foreignKey: 'createdFor', as: 'customer' })
  customer: Customer;

  @BelongsTo(() => Address, { foreignKey: 'shipTo', as: 'shippingAddress' })
  shippingAddress: Address;

  @BelongsTo(() => Quotation, { foreignKey: 'quotationId', as: 'quotation' })
  quotation: Quotation;

  @HasMany(() => OrderDispatch, { foreignKey: 'orderId', as: 'dispatches' })
  dispatches: OrderDispatch[];

  @HasMany(() => OrderCreditNote, { foreignKey: 'orderId', as: 'creditNotes' })
  creditNotes: OrderCreditNote[];

  @HasMany(() => OrderActivity, { foreignKey: 'orderId', as: 'activityLog' })
  activityLog: OrderActivity[];

  // NOTE: previousOrder/nextOrders/masterOrder/pipelineOrders are
  // self-referencing associations keyed on orderNo (not the PK). Query
  // these explicitly in the service layer with
  // Order.findOne({ where: { orderNo } }) instead of a declared
  // association, to avoid sequelize-typescript self-reference quirks.
}
