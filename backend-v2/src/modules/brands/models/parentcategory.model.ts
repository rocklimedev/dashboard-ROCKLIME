import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  HasMany,
  BeforeValidate,
} from 'sequelize-typescript';

import { Category } from '@/modules/categories/entities/category.entity';
import { BrandParentCategory } from '@/modules/brand-parent-categories/entities/brand-parent-category.entity';

@Table({
  tableName: 'parentcategories',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name'],
    },
    {
      unique: true,
      fields: ['slug'],
    },
  ],
})
export class ParentCategory extends Model<ParentCategory> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Unique
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  })
  name: string;

  @Unique
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[a-z0-9-]+$/i,
    },
  })
  slug: string;

  @BeforeValidate
  static generateSlug(instance: ParentCategory) {
    if (instance.name && !instance.slug) {
      instance.slug = instance.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '');
    }
  }

  // ----------------------------------
  // Associations
  // ----------------------------------

  @HasMany(() => Category, {
    foreignKey: 'parentCategoryId',
    as: 'categories',
  })
  categories: Category[];

  @HasMany(() => BrandParentCategory, {
    foreignKey: 'parentCategoryId',
    as: 'brandParentCategories',
  })
  brandParentCategories: BrandParentCategory[];
}
