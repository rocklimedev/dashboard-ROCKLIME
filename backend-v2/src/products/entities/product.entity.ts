import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Brand } from '../../brands/entities/brand.entity';
import { Category } from '../../categories/entities/category.entity';
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { BrandParentCategory } from 'src/brands/entities/brand-parent-category.entity';
import { ProductKeyword } from './product-keyword.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  OUT_OF_STOCK = 'out_of_stock',
  BULK_STOCKED = 'bulk_stocked',
}

@Entity('products')
@Index(['product_code'], { unique: true })
@Index(['masterProductId'])
@Index(['isMaster'])
@Index(['variantKey'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  productId: string;

  @Column()
  name: string;

  @Column()
  product_code: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  // ─────────────────────────────
  // Variant System
  // ─────────────────────────────

  @Column({ nullable: true })
  masterProductId: string;

  @Column({ type: 'boolean', default: false })
  isMaster: boolean;

  @Column({ type: 'json', nullable: true })
  variantOptions: any;

  @Column({ nullable: true })
  variantKey: string;

  @Column({ length: 50, nullable: true })
  skuSuffix: string;

  // ─────────────────────────────

  @Column({
    type: 'enum',
    enum: ['percent', 'fixed'],
    nullable: true,
  })
  discountType: 'percent' | 'fixed';

  @Column({ type: 'int', nullable: true })
  alert_quantity: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tax: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', default: [] })
  images: string[];

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ nullable: true })
  brandId: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({ nullable: true })
  vendorId: string;

  @ManyToOne(() => BrandParentCategory, { nullable: true })
  @JoinColumn({ name: 'brand_parentcategoriesId' })
  brandParentCategory: BrandParentCategory;

  @Column({ nullable: true })
  brand_parentcategoriesId: string;

  // M:N via join entity
  @OneToMany(
    () => ProductKeyword,
    (pk) => pk.product,
  )
  product_keywords: ProductKeyword[];

  // ─────────────────────────────
  // Meta (JSON — recommended)
  // ─────────────────────────────

  @Column({ type: 'json', nullable: true })
  meta: any;

  // ─────────────────────────────
  // Hooks
  // ─────────────────────────────

  @BeforeInsert()
  @BeforeUpdate()
  normalizeName() {
    if (this.name) {
      this.name = this.name.trim();
    }
  }

  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}