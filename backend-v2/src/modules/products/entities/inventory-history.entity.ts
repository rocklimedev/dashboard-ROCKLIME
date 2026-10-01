import {
  BeforeBulkCreate,
  BeforeValidate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { v7 as uuidv7 } from 'uuid';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';

@Table({
  tableName: 'inventory_history',
  timestamps: true,
  indexes: [
    { name: 'idx_product_created', fields: ['productId', 'createdAt'] },
    { name: 'idx_created_at', fields: ['createdAt'] },
    { name: 'idx_action', fields: ['action'] },
    { name: 'idx_user', fields: ['userId'] },
    { name: 'idx_order_no', fields: ['orderNo'] },
  ],
})
export class InventoryHistory extends Model<InventoryHistory> {
  @Column({ type: DataType.CHAR(36), primaryKey: true, allowNull: false })
  id: string;

  @ForeignKey(() => Product)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  productId: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  change: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantityAfter: number;

  @Column({
    type: DataType.ENUM(
      'add-stock',
      'remove-stock',
      'sale',
      'return',
      'adjustment',
      'correction',
    ),
    allowNull: false,
  })
  action: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  orderNo: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  userId: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  message: string;

  @BelongsTo(() => Product, { foreignKey: 'productId', as: 'product' })
  product: Product;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  user: User;

  @BeforeValidate
  static assignId(instance: InventoryHistory) {
    if (!instance.id) instance.id = uuidv7();
  }

  @BeforeBulkCreate
  static assignIds(instances: InventoryHistory[]) {
    instances.forEach((instance) => {
      if (!instance.id) instance.id = uuidv7();
    });
  }
}
