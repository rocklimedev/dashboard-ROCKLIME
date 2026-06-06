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

import { Brand } from '@/modules/brands/entities/brand.entity';
import { ParentCategory } from '@/modules/parent-categories/entities/parent-category.entity';
import { BrandParentCategoryBrand } from './brand-parent-category-brand.entity';

@Table({
  tableName: 'brand_parentcategories',
  timestamps: true,
})
export class BrandParentCategory extends Model<BrandParentCategory> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Unique
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @Unique
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  slug: string;

  // ----------------------------------
  // Associations
  // ----------------------------------

  // BrandParentCategory ↔ Brand (M:N)
  @BelongsToMany(
    () => Brand,
    () => BrandParentCategoryBrand,
    'brandParentCategoryId',
    'brandId',
  )
  brands: Brand[];

  // BrandParentCategory → ParentCategory (1:N)
  @HasMany(() => ParentCategory, {
    foreignKey: 'brandParentCategoryId',
    as: 'parentCategories',
  })
  parentCategories: ParentCategory[];
}
