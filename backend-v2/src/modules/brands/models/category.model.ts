import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { Brand } from '@/modules/brands/entities/brand.entity';
import { ParentCategory } from '@/modules/parent-categories/entities/parent-category.entity';
import { Keyword } from '@/modules/keywords/entities/keyword.entity';

@Table({
  tableName: 'categories',
  timestamps: true,
  indexes: [
    {
      fields: ['brandId'],
    },
    {
      fields: ['parentCategoryId'],
    },
    {
      unique: true,
      fields: ['slug'],
    },
    {
      unique: true,
      fields: ['name', 'brandId'],
    },
  ],
})
export class Category extends Model<Category> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    field: 'categoryId',
  })
  categoryId: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  slug: string;

  @ForeignKey(() => Brand)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'brandId',
  })
  brandId: string;

  @ForeignKey(() => ParentCategory)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'parentCategoryId',
  })
  parentCategoryId: string;

  // ----------------------------------
  // Associations
  // ----------------------------------

  // Category → Brand (N:1)
  @BelongsTo(() => Brand, {
    foreignKey: 'brandId',
    as: 'brand',
  })
  brand: Brand;

  // Category → ParentCategory (N:1)
  @BelongsTo(() => ParentCategory, {
    foreignKey: 'parentCategoryId',
    as: 'parentCategory',
  })
  parentCategory: ParentCategory;

  // Category → Keyword (1:N)
  @HasMany(() => Keyword, {
    foreignKey: 'categoryId',
    as: 'keywords',
  })
  keywords: Keyword[];
}
