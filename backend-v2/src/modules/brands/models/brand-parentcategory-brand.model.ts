import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Brand } from '@/modules/brands/entities/brand.entity';
import { BrandParentCategory } from './brand-parent-category.entity';

@Table({
  tableName: 'brand_parentcategory_brands',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['brandParentCategoryId', 'brandId'],
    },
  ],
})
export class BrandParentCategoryBrand extends Model<BrandParentCategoryBrand> {
  @PrimaryKey
  @ForeignKey(() => BrandParentCategory)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  brandParentCategoryId: string;

  @PrimaryKey
  @ForeignKey(() => Brand)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  brandId: string;

  @BelongsTo(() => BrandParentCategory)
  brandParentCategory: BrandParentCategory;

  @BelongsTo(() => Brand)
  brand: Brand;
}
