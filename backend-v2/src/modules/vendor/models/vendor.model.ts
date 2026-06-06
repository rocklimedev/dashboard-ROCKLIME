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
import { Product } from '@/modules/products/entities/product.entity';

@Table({
  tableName: 'vendors',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  engine: 'InnoDB',
})
export class Vendor extends Model<Vendor> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  vendorId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  vendorName: string;

  // -----------------------------------
  // Brand relations
  // -----------------------------------

  @ForeignKey(() => Brand)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  brandId: string;

  @ForeignKey(() => Brand)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  brandSlug: string;

  @BelongsTo(() => Brand, {
    foreignKey: 'brandId',
    as: 'brand',
  })
  brand: Brand;

  // -----------------------------------
  // Products relation
  // -----------------------------------

  @HasMany(() => Product, {
    foreignKey: 'vendorId',
    as: 'products',
  })
  products: Product[];
}
