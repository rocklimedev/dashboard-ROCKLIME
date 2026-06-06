import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';

import { Vendor } from '@/modules/vendors/entities/vendor.entity';
import { Category } from '@/modules/categories/entities/category.entity';
import { BrandParentCategory } from '@/modules/brand-parent-categories/entities/brand-parent-category.entity';
import { BrandParentCategoryBrand } from '@/modules/brand-parent-categories/entities/brand-parent-category-brand.entity';

@Table({
  tableName: 'brands',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['brandName'],
    },
    {
      unique: true,
      fields: ['brandSlug'],
    },
  ],
})
export class Brand extends Model<Brand> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Unique
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  brandName: string;

  @Unique
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  brandSlug: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    defaultValue: null,
  })
  logo: string;

  // ----------------------------------
  // Associations
  // ----------------------------------

  // Brand → Vendor (1:N)
  @HasMany(() => Vendor, {
    foreignKey: 'brandId',
    as: 'vendors',
  })
  vendors: Vendor[];

  // Brand → Category (1:N)
  @HasMany(() => Category, {
    foreignKey: 'brandId',
    as: 'categories',
  })
  categories: Category[];

  // Brand ↔ BrandParentCategory (M:N)
  @BelongsToMany(
    () => BrandParentCategory,
    () => BrandParentCategoryBrand,
    'brandId',
    'brandParentCategoryId',
  )
  brandParentCategories: BrandParentCategory[];
}
