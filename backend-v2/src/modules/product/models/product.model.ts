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
  BelongsToMany,
} from 'sequelize-typescript';

import { Brand } from '@/modules/brands/entities/brand.entity';
import { Category } from '@/modules/categories/entities/category.entity';
import { Vendor } from '@/modules/vendors/entities/vendor.entity';
import { BrandParentCategory } from '@/modules/brand-parent-categories/entities/brand-parent-category.entity';
import { Keyword } from '@/modules/keywords/entities/keyword.entity';
import { ProductKeyword } from '@/modules/product-keywords/entities/product-keyword.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  OUT_OF_STOCK = 'out_of_stock',
  BULK_STOCKED = 'bulk_stocked',
}

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

@Table({
  tableName: 'products',
  timestamps: true,
  indexes: [
    {
      fields: ['masterProductId'],
    },
    {
      fields: ['isMaster'],
    },
    {
      fields: ['variantKey'],
    },
    {
      fields: ['product_code'],
    },
  ],
})
export class Product extends Model<Product> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  productId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  product_code: string;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  quantity: number;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'If this is a variant, points to the master product',
  })
  masterProductId: string;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    comment: 'True only for the main product that owns variants',
  })
  isMaster: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: 'e.g. { color: "Red", finish: "Matte", size: "60x60" }',
  })
  variantOptions: Record<string, any>;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Human readable: Red Matte, Blue Glossy',
  })
  variantKey: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  skuSuffix: string;

  @Column({
    type: DataType.ENUM(DiscountType.PERCENT, DiscountType.FIXED),
    allowNull: true,
  })
  discountType: DiscountType;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  alert_quantity: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
  })
  tax: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Default([])
  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  images: string[];

  @Default(false)
  @Column(DataType.BOOLEAN)
  isFeatured: boolean;

  @Default(ProductStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(ProductStatus)),
    allowNull: false,
  })
  status: ProductStatus;

  @ForeignKey(() => Brand)
  @Column(DataType.UUID)
  brandId: string;

  @ForeignKey(() => Category)
  @Column(DataType.UUID)
  categoryId: string;

  @ForeignKey(() => Vendor)
  @Column(DataType.UUID)
  vendorId: string;

  @ForeignKey(() => BrandParentCategory)
  @Column(DataType.UUID)
  brand_parentcategoriesId: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  meta: Record<string, any>;

  // ====================================
  // SELF REFERENCING VARIANTS
  // ====================================

  @BelongsTo(() => Product, {
    foreignKey: 'masterProductId',
    as: 'masterProduct',
  })
  masterProduct: Product;

  @HasMany(() => Product, {
    foreignKey: 'masterProductId',
    as: 'variants',
  })
  variants: Product[];

  // ====================================
  // RELATIONS
  // ====================================

  @BelongsTo(() => Brand, {
    foreignKey: 'brandId',
    as: 'brand',
  })
  brand: Brand;

  @BelongsTo(() => Category, {
    foreignKey: 'categoryId',
    as: 'categories',
  })
  categories: Category;

  @BelongsTo(() => Vendor, {
    foreignKey: 'vendorId',
    as: 'vendors',
  })
  vendors: Vendor;

  @BelongsTo(() => BrandParentCategory, {
    foreignKey: 'brand_parentcategoriesId',
    as: 'brand_parentcategories',
  })
  brand_parentcategories: BrandParentCategory;

  // ====================================
  // KEYWORDS M:N
  // ====================================

  @BelongsToMany(() => Keyword, {
    through: () => ProductKeyword,
    foreignKey: 'productId',
    otherKey: 'keywordId',
    as: 'keywords',
  })
  keywords: Keyword[];

  @HasMany(() => ProductKeyword, {
    foreignKey: 'productId',
    as: 'product_keywords',
  })
  product_keywords: ProductKeyword[];
}
