import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Keyword } from './keyword.entity';
import { ProductKeyword } from './product-keyword.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';

@Table({
  tableName: 'products',
  timestamps: true,
  indexes: [
    { fields: ['masterProductId'] },
    { fields: ['isMaster'] },
    { fields: ['variantKey'] },
    { fields: ['product_code'] },
  ],
})
export class Product extends Model<Product> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  })
  productId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  product_code: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  quantity: number;

  @Column({ type: DataType.UUID, allowNull: true })
  masterProductId: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isMaster: boolean;

  @Column({ type: DataType.JSON, allowNull: true })
  variantOptions: Record<string, any>;

  @Column({ type: DataType.STRING, allowNull: true })
  variantKey: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  skuSuffix: string;

  @Column({ type: DataType.ENUM('percent', 'fixed'), allowNull: true })
  discountType: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  alert_quantity: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  tax: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  // Stored as JSON-stringified array, same representation as the legacy
  // model. Parsed to a real array in ProductsService.
  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [] })
  images: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isFeatured: boolean;

  @Column({
    type: DataType.ENUM(
      'active',
      'inactive',
      'expired',
      'out_of_stock',
      'bulk_stocked',
      'low_stock',
    ),
    allowNull: false,
    defaultValue: 'active',
  })
  status: string;

  // NOTE: brandId / categoryId / vendorId / brand_parentcategoriesId stay
  // as plain UUID columns (no @BelongsTo) until BrandsModule / VendorsModule
  // are migrated - see docs/MIGRATION_PLAN.md. Same for `meta`'s legacy
  // belongsTo(ProductMeta) association, which was non-standard anyway
  // (meta is a JSON blob of {metaId: value}, not a single FK).
  @Column({ type: DataType.UUID, allowNull: true })
  brandId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  categoryId: string;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.UUID, allowNull: true })
  vendorId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  brand_parentcategoriesId: string;

  @Column({ type: DataType.JSON, allowNull: true })
  meta: Record<string, any>;

  @BelongsTo(() => Vendor, { foreignKey: 'vendorId', as: 'vendor' })
  vendor: Vendor;

  @BelongsToMany(() => Keyword, () => ProductKeyword)
  keywords: Keyword[];

  @HasMany(() => ProductKeyword, { as: 'product_keywords' })
  productKeywords: ProductKeyword[];
}
