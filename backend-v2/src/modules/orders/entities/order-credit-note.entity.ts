import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
import { OrderCreditNoteItem } from './order-credit-note-item.entity';

@Table({
  tableName: 'order_credit_notes',
  timestamps: true,
  indexes: [
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['creditNoteNumber'] },
    { fields: ['status'] },
    { fields: ['creditNoteDate'] },
  ],
})
export class OrderCreditNote extends Model<OrderCreditNote> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  orderId: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  orderNo: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  creditNoteNumber: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  creditNoteLink: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  creditNoteDate: Date;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  totalQuantity: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  totalAmount: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  reason: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  remarks: string;

  @Column({
    type: DataType.ENUM('DRAFT', 'ISSUED', 'RECEIVED', 'CANCELED'),
    allowNull: false,
    defaultValue: 'ISSUED',
  })
  status: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  createdBy: string;

  @BelongsTo(() => Order, { foreignKey: 'orderId', as: 'order' })
  order: Order;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  creator: User;

  @HasMany(() => OrderCreditNoteItem, { foreignKey: 'creditNoteId', as: 'items' })
  items: OrderCreditNoteItem[];
}
