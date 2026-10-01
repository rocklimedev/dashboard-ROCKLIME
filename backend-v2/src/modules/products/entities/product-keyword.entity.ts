import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Product } from './product.entity';
import { Keyword } from './keyword.entity';

@Table({
  tableName: 'products_keywords',
  timestamps: true,
  indexes: [
    { name: 'idx_productId', fields: ['productId'] },
    { name: 'idx_keywordId', fields: ['keywordId'] },
    {
      name: 'unique_product_keyword',
      unique: true,
      fields: ['productId', 'keywordId'],
    },
  ],
})
export class ProductKeyword extends Model<ProductKeyword> {
  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false, primaryKey: true })
  productId: string;

  @ForeignKey(() => Keyword)
  @Column({ type: DataType.UUID, allowNull: false, primaryKey: true })
  keywordId: string;

  @BelongsTo(() => Product, { foreignKey: 'productId', as: 'product' })
  product: Product;

  @BelongsTo(() => Keyword, { foreignKey: 'keywordId', as: 'keyword' })
  keyword: Keyword;
}
