import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  BeforeValidate,
  BeforeBulkCreate,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { v7 as uuidv7 } from 'uuid';

import { Product } from '@/modules/products/entities/product.entity';
import { User } from '@/modules/users/entities/user.entity';

export enum InventoryAction {
  ADD_STOCK = 'add-stock',
  REMOVE_STOCK = 'remove-stock',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  CORRECTION = 'correction',
}

@Table({
  tableName: 'inventory_history',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      name: 'idx_product_created',
      fields: ['productId', 'createdAt'],
    },
    {
      name: 'idx_created_at',
      fields: ['createdAt'],
    },
    {
      name: 'idx_action',
      fields: ['action'],
    },
    {
      name: 'idx_user',
      fields: ['userId'],
    },
    {
      name: 'idx_order_no',
      fields: ['orderNo'],
    },
  ],
})
export class InventoryHistory extends Model<InventoryHistory> {
  @PrimaryKey
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    comment: 'UUID v7 – time-ordered, distributed-safe, sortable by time',
  })
  id: string;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    comment: 'Reference to Product.id (UUID)',
  })
  productId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Positive = stock added, Negative = stock removed',
  })
  change: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Stock quantity AFTER this transaction',
  })
  quantityAfter: number;

  @Column({
    type: DataType.ENUM(...Object.values(InventoryAction)),
    allowNull: false,
  })
  action: InventoryAction;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: 'Optional reference to order number',
  })
  orderNo: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    comment: 'Optional reference to User.id (UUID)',
  })
  userId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Human-readable description of the stock change',
  })
  message: string;

  // --------------------------------
  // Associations
  // --------------------------------

  @BelongsTo(() => Product, {
    foreignKey: 'productId',
    as: 'product',
  })
  product: Product;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    as: 'user',
    constraints: false,
  })
  user: User;

  // --------------------------------
  // Hooks
  // --------------------------------

  @BeforeValidate
  static generateUuid(instance: InventoryHistory) {
    if (!instance.id) {
      instance.id = uuidv7();
    }
  }

  @BeforeBulkCreate
  static generateBulkUuid(instances: InventoryHistory[]) {
    for (const instance of instances) {
      if (!instance.id) {
        instance.id = uuidv7();
      }
    }
  }
}
