import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';

import { Order } from '@/modules/orders/entities/order.entity';
import { Address } from '@/modules/addresses/entities/address.entity';
import { Vendor } from '@/modules/vendors/entities/vendor.entity';
import { Quotation } from '@/modules/quotations/entities/quotation.entity';

export enum CustomerType {
  RETAIL = 'Retail',
  ARCHITECT = 'Architect',
  INTERIOR = 'Interior',
  BUILDER = 'Builder',
  CONTRACTOR = 'Contractor',
}

@Table({
  tableName: 'customers',
  timestamps: true,
  indexes: [
    {
      fields: ['mobileNumber'],
    },
    {
      fields: ['email'],
    },
    {
      fields: ['isVendor'],
    },
    {
      fields: ['customerType'],
    },
    {
      fields: ['gstNumber'],
    },
  ],
})
export class Customer extends Model<Customer> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    field: 'customerId',
  })
  customerId: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  })
  name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    validate: {
      len: [10, 15],
    },
  })
  mobileNumber: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  phone2: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: true,
  })
  companyName: string;

  @Default(CustomerType.RETAIL)
  @Column({
    type: DataType.ENUM(
      CustomerType.RETAIL,
      CustomerType.ARCHITECT,
      CustomerType.INTERIOR,
      CustomerType.BUILDER,
      CustomerType.CONTRACTOR,
    ),
    allowNull: true,
  })
  customerType: CustomerType;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  address: Record<string, any>;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  isVendor: boolean;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  vendorId: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    validate: {
      len: [15, 15],
      isAlphanumeric: true,
    },
  })
  gstNumber: string;

  // ----------------------------------
  // Associations
  // ----------------------------------

  @HasMany(() => Order, {
    foreignKey: 'createdFor',
    as: 'customerOrders',
  })
  customerOrders: Order[];

  @HasMany(() => Address, {
    foreignKey: 'customerId',
    as: 'addresses',
  })
  addresses: Address[];

  @BelongsTo(() => Vendor, {
    foreignKey: 'vendorId',
    as: 'vendor',
  })
  vendor: Vendor;

  @HasMany(() => Quotation, {
    foreignKey: 'customerId',
    as: 'customerQuotations',
  })
  customerQuotations: Quotation[];
}
