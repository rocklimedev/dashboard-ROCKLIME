// src/modules/addresses/entities/address.entity.ts
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
import { User } from '@/modules/users/models/user.model';
import { Customer } from '@/modules/customer/models/customer.model';
import { Order } from '@/modules/orders/models/order.model';

export enum AddressStatus {
  BILLING = 'BILLING',
  PRIMARY = 'PRIMARY',
  ADDITIONAL = 'ADDITIONAL',
}

@Table({
  tableName: 'addresses',
  timestamps: true,
})
export class Address extends Model<Address> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  addressId: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  street: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  city: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  state: string;

  @Column({ type: DataType.STRING(20) })
  postalCode: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  country: string;

  @Default(AddressStatus.ADDITIONAL)
  @Column({
    type: DataType.ENUM(
      AddressStatus.BILLING,
      AddressStatus.PRIMARY,
      AddressStatus.ADDITIONAL,
    ),
    allowNull: false,
  })
  status: AddressStatus;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  userId: string | null;

  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID, allowNull: true })
  customerId: string | null;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  user: User;

  @BelongsTo(() => Customer, { foreignKey: 'customerId', as: 'customer' })
  customer: Customer;

  @HasMany(() => Order, { foreignKey: 'shipTo', as: 'orders' })
  orders: Order[];
}
