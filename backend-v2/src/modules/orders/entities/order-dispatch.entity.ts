import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';

@Table({
  tableName: 'order_dispatches',
  timestamps: true,
  indexes: [
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['status'] },
    { fields: ['dispatchDate'] },
  ],
})
export class OrderDispatch extends Model<OrderDispatch> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  orderId: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  orderNo: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  dispatchNumber: string;

  // JSON array of { productId, name, quantity, ... } - a subset of the
  // order's products being dispatched in this batch.
  @Column({ type: DataType.JSON, allowNull: false })
  items: Record<string, any>[];

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  dispatchDate: Date;

  @Column({ type: DataType.STRING(100), allowNull: true })
  courierName: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  trackingNumber: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  documentLink: string;

  @Column({
    type: DataType.ENUM('PREPARED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'),
    allowNull: false,
    defaultValue: 'DISPATCHED',
  })
  status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  remarks: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  createdBy: string;

  @BelongsTo(() => Order, { foreignKey: 'orderId', as: 'order' })
  order: Order;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  creator: User;
}
