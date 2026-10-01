import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { OrderCreditNote } from './order-credit-note.entity';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Table({
  tableName: 'order_credit_note_items',
  timestamps: true,
  indexes: [{ fields: ['creditNoteId'] }, { fields: ['orderId'] }, { fields: ['productId'] }],
})
export class OrderCreditNoteItem extends Model<OrderCreditNoteItem> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id: string;

  @ForeignKey(() => OrderCreditNote)
  @Column({ type: DataType.UUID, allowNull: false })
  creditNoteId: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  orderId: string;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false })
  productId: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  productCode: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  name: string;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false })
  quantity: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false })
  price: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  discount: number;

  @Column({
    type: DataType.ENUM('percent', 'fixed'),
    allowNull: false,
    defaultValue: 'percent',
  })
  discountType: string;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  tax: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false })
  total: number;

  @Column({ type: DataType.STRING(255), allowNull: true })
  reason: string;

  @BelongsTo(() => OrderCreditNote, { foreignKey: 'creditNoteId', as: 'creditNote' })
  creditNote: OrderCreditNote;

  @BelongsTo(() => Order, { foreignKey: 'orderId', as: 'order' })
  order: Order;

  @BelongsTo(() => Product, { foreignKey: 'productId', as: 'product' })
  product: Product;
}
