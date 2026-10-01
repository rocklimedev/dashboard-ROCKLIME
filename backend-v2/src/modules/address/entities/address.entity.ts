import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'addresses', timestamps: true })
export class Address extends Model<Address> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  addressId: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  street: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  city: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  state: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  postalCode: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  country: string;

  @Column({
    type: DataType.ENUM('BILLING', 'PRIMARY', 'ADDITIONAL'),
    allowNull: false,
    defaultValue: 'ADDITIONAL',
  })
  status: string;

  @Column({ type: DataType.UUID, allowNull: true })
  userId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  customerId: string;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  user: User;

  // NOTE: `customer` (belongsTo Customer) and `orders` (hasMany Order via
  // shipTo) associations get added once the customers/orders modules are
  // migrated - see docs/MIGRATION_PLAN.md.
}
