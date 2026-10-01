import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../products/entities/product.entity';

@Table({
  tableName: 'vendors',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Vendor extends Model<Vendor> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: () => uuidv4() })
  id: string;

  @Column({ type: DataType.STRING, allowNull: true, unique: true })
  vendorId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  vendorName: string;

  // NOTE: plain column, no @BelongsTo - BrandsModule not migrated yet
  // (see docs/MIGRATION_PLAN.md)
  @Column({ type: DataType.UUID, allowNull: true })
  brandId: string;

  @Column({ type: DataType.STRING, allowNull: true })
  brandSlug: string;

  @HasMany(() => Product, { foreignKey: 'vendorId', as: 'products' })
  products: Product[];
}
