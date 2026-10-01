import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';

@Table({
  tableName: 'order_activity',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['action'] },
    { fields: ['createdAt'] },
  ],
})
export class OrderActivity extends Model<OrderActivity> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  orderId: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  orderNo: string;

  @Column({ type: DataType.STRING(60), allowNull: false })
  action: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.JSON, allowNull: true })
  oldValue: Record<string, any>;

  @Column({ type: DataType.JSON, allowNull: true })
  newValue: Record<string, any>;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  performedBy: string;

  @Column({ type: DataType.JSON, allowNull: true })
  metadata: Record<string, any>;

  @Column({ type: DataType.STRING(64), allowNull: true })
  ipAddress: string;

  @BelongsTo(() => Order, { foreignKey: 'orderId', as: 'order' })
  order: Order;

  @BelongsTo(() => User, { foreignKey: 'performedBy', as: 'performedByUser' })
  performedByUser: User;
}
