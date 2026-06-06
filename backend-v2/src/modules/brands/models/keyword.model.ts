import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  HasMany,
  BeforeValidate,
} from 'sequelize-typescript';

import { Category } from '@/modules/categories/entities/category.entity';
import { Product } from '@/modules/products/entities/product.entity';
import { ProductKeyword } from '@/modules/product-keywords/entities/product-keyword.entity';

@Table({
  tableName: 'keywords',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['keyword'],
    },
    {
      fields: ['categoryId'],
    },

    // PostgreSQL Trigram Index (optional)
    // {
    //   name: 'idx_keyword_trgm',
    //   fields: ['keyword'],
    //   using: 'GIN',
    //   operator: 'gin_trgm_ops',
    // },
  ],
})
export class Keyword extends Model<Keyword> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  })
  keyword: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  categoryId: string;

  // ----------------------------------
  // Hooks
  // ----------------------------------

  @BeforeValidate
  static normalizeKeyword(instance: Keyword) {
    if (instance.keyword) {
      instance.keyword = instance.keyword.trim().toLowerCase();
    }
  }

  // ----------------------------------
  // Associations
  // ----------------------------------

  // Keyword → Category (M:1)
  @BelongsTo(() => Category, {
    foreignKey: 'categoryId',
    as: 'category',
  })
  category: Category;

  // Keyword ↔ Product (M:N)
  @BelongsToMany(() => Product, () => ProductKeyword, 'keywordId', 'productId')
  products: Product[];

  // Keyword → ProductKeyword (1:M)
  @HasMany(() => ProductKeyword, {
    foreignKey: 'keywordId',
    as: 'productKeywordMappings',
  })
  productKeywordMappings: ProductKeyword[];
}
