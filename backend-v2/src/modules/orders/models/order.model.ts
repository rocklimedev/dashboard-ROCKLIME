import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { User } from '@/modules/users/entities/user.entity';
import { Team } from '@/modules/teams/entities/team.entity';
import { Customer } from '@/modules/customers/entities/customer.entity';
import { Address } from '@/modules/addresses/entities/address.entity';
import { Quotation } from '@/modules/quotations/entities/quotation.entity';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PREPARING = 'PREPARING',
  CHECKING = 'CHECKING',
  INVOICE = 'INVOICE',
  DISPATCHED = 'DISPATCHED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  DELIVERED = 'DELIVERED',
  ONHOLD = 'ONHOLD',
  CANCELED = 'CANCELED',
  CLOSED = 'CLOSED',
}

export enum OrderPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

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
    {
      name: 'idx_order_status_date',
      fields: ['status', 'createdAt'],
    },
  ],
})
export class Order extends Model<Order> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.STRING(30),
    allowNull: false,
    unique: true,
  })
  orderNo: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  products: any;

  @Default(OrderStatus.DRAFT)
  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    allowNull: false,
  })
  status: OrderStatus;

  @Default(OrderPriority.MEDIUM)
  @Column({
    type: DataType.ENUM(...Object.values(OrderPriority)),
    allowNull: false,
  })
  priority: OrderPriority;

  @Column(DataType.DATEONLY)
  dueDate: string;

  @Column(DataType.JSON)
  followupDates: any;

  @Column(DataType.STRING(100))
  source: string;

  @Column(DataType.TEXT)
  description: string;

  @ForeignKey(() => Customer)
  @Column(DataType.UUID)
  createdFor: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  createdBy: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  assignedUserId: string;

  @ForeignKey(() => Team)
  @Column(DataType.UUID)
  assignedTeamId: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  secondaryUserId: string;

  @ForeignKey(() => Quotation)
  @Column(DataType.UUID)
  quotationId: string;

  @ForeignKey(() => Address)
  @Column(DataType.UUID)
  shipTo: string;

  @Column(DataType.STRING(500))
  gatePassLink: string;

  @Column(DataType.STRING(500))
  invoiceLink: string;

  @Column(DataType.STRING(30))
  masterPipelineNo: string;

  @Column(DataType.STRING(30))
  previousOrderNo: string;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  shipping: number;

  @Column(DataType.DECIMAL(5, 2))
  gst: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  gstValue: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  extraDiscount: number;

  @Column({
    type: DataType.ENUM(DiscountType.PERCENT, DiscountType.FIXED),
    allowNull: true,
  })
  extraDiscountType: DiscountType;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  extraDiscountValue: number;

  @Default(0)
  @Column(DataType.DECIMAL(14, 2))
  finalAmount: number;

  @Default(0)
  @Column(DataType.DECIMAL(14, 2))
  amountPaid: number;

  // ===========================
  // USER RELATIONS
  // ===========================

  @BelongsTo(() => User, {
    foreignKey: 'createdBy',
    as: 'creator',
  })
  creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'assignedUserId',
    as: 'assignedUser',
  })
  assignedUser: User;

  @BelongsTo(() => User, {
    foreignKey: 'secondaryUserId',
    as: 'secondaryUser',
  })
  secondaryUser: User;

  // ===========================
  // TEAM
  // ===========================

  @BelongsTo(() => Team, {
    foreignKey: 'assignedTeamId',
    as: 'assignedTeam',
  })
  assignedTeam: Team;

  // ===========================
  // CUSTOMER
  // ===========================

  @BelongsTo(() => Customer, {
    foreignKey: 'createdFor',
    as: 'customer',
  })
  customer: Customer;

  // ===========================
  // ADDRESS
  // ===========================

  @BelongsTo(() => Address, {
    foreignKey: 'shipTo',
    as: 'shippingAddress',
  })
  shippingAddress: Address;

  // ===========================
  // QUOTATION
  // ===========================

  @BelongsTo(() => Quotation, {
    foreignKey: 'quotationId',
    as: 'quotation',
  })
  quotation: Quotation;

  // ===========================
  // SELF REFERENCES
  // ===========================

  @BelongsTo(() => Order, {
    foreignKey: 'previousOrderNo',
    targetKey: 'orderNo',
    as: 'previousOrder',
  })
  previousOrder: Order;

  @HasMany(() => Order, {
    foreignKey: 'previousOrderNo',
    sourceKey: 'orderNo',
    as: 'nextOrders',
  })
  nextOrders: Order[];

  @BelongsTo(() => Order, {
    foreignKey: 'masterPipelineNo',
    targetKey: 'orderNo',
    as: 'masterOrder',
  })
  masterOrder: Order;

  @HasMany(() => Order, {
    foreignKey: 'masterPipelineNo',
    sourceKey: 'orderNo',
    as: 'pipelineOrders',
  })
  pipelineOrders: Order[];
}
