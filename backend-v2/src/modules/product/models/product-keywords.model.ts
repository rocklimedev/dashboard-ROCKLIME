import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
} from 'sequelize-typescript';

import { Product } from '@/modules/product/models/product.model';
import { Keyword } from '@/modules/brands/models/keyword.model';

@Table({
  tableName: 'products_keywords',
  timestamps: true,
  indexes: [
    {
      name: 'idx_productId',
      fields: ['productId'],
    },
    {
      name: 'idx_keywordId',
      fields: ['keywordId'],
    },
    {
      name: 'unique_product_keyword',
      unique: true,
      fields: ['productId', 'keywordId'],
    },
  ],
})
export class ProductKeyword extends Model<ProductKeyword> {
  @PrimaryKey
  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  productId: string;

  @PrimaryKey
  @ForeignKey(() => Keyword)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  keywordId: string;

  // ---------------------------
  // Associations
  // ---------------------------

  @BelongsTo(() => Product, {
    foreignKey: 'productId',
    as: 'product',
  })
  product: Product;

  @BelongsTo(() => Keyword, {
    foreignKey: 'keywordId',
    as: 'keyword',
  })
  keyword: Keyword;
}
