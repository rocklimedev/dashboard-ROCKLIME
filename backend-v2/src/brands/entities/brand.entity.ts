import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Vendor } from 'src/vendors/entities/vendor.entity';
import { Category } from 'src/categories/entities/category.entity';
import { BrandParentCategoryBrand } from './brand-parentcategory-brands';

@Entity('brands')
@Index(['brandName'], { unique: true })
@Index(['brandSlug'], { unique: true })
export class Brand {
  // ─────────────────────────────
  // Primary Key
  // ─────────────────────────────
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ─────────────────────────────
  // Fields
  // ─────────────────────────────
  @Column({ type: 'varchar', length: 100 })
  brandName!: string;

  @Column({ type: 'varchar', length: 255 })
  brandSlug!: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @OneToMany(() => Vendor, (vendor) => vendor.brand)
  vendors!: Vendor[];

  @OneToMany(() => Category, (category) => category.brand)
  categories!: Category[];

  // ✅ Use junction entity instead of ManyToMany
  @OneToMany(
    () => BrandParentCategoryBrand,
    (bpcb) => bpcb.brand,
  )
  brandParentCategoryLinks!: BrandParentCategoryBrand[];

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}