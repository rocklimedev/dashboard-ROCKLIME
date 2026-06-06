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
import { Customer } from '@/modules/customers/entities/customer.entity';
import { Address } from '@/modules/addresses/entities/address.entity';
import { Order } from '@/modules/orders/entities/order.entity';

@Table({
  tableName: 'quotations',
  timestamps: true,
})
export class Quotation extends Model<Quotation> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  quotationId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  document_title: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  quotation_date: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  due_date: Date;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: null,
  })
  followupDates: any;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  reference_number: string;

  // ----------------------------------
  // Floor & Room structure
  // ----------------------------------

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  totalFloors: number;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
  })
  floors: any[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  products: any;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  discountAmount: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  roundOff: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  finalAmount: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  signature_name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  signature_image: string;

  // ----------------------------------
  // Relations
  // ----------------------------------

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  createdBy: string;

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  customerId: string;

  @ForeignKey(() => Address)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  shipTo: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  extraDiscount: number;

  @Column({
    type: DataType.ENUM('percent', 'fixed'),
    allowNull: true,
  })
  extraDiscountType: 'percent' | 'fixed';

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  shippingAmount: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  gst: number;

  // ----------------------------------
  // Associations
  // ----------------------------------

  @BelongsTo(() => User, {
    foreignKey: 'createdBy',
    as: 'creator',
  })
  creator: User;

  @BelongsTo(() => Customer, {
    foreignKey: 'customerId',
    as: 'customer',
  })
  customer: Customer;

  @BelongsTo(() => Address, {
    foreignKey: 'shipTo',
    as: 'shippingAddress',
  })
  shippingAddress: Address;

  @HasMany(() => Order, {
    foreignKey: 'quotationId',
    as: 'orders',
  })
  orders: Order[];
}
