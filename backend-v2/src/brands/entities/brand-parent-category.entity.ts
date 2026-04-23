import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ParentCategory } from 'src/categories/entities/parent-category.entity';
import { BrandParentCategoryBrand } from './brand-parentcategory-brands';
@Entity('brand_parentcategories')
@Index(['name'], { unique: true })
@Index(['slug'], { unique: true })
export class BrandParentCategory {
  // ─────────────────────────────
  // Primary Key
  // ─────────────────────────────
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ─────────────────────────────
  // Fields
  // ─────────────────────────────
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  // ✅ Use junction entity instead of ManyToMany
  @OneToMany(
    () => BrandParentCategoryBrand,
    (bpcb) => bpcb.brandParentCategory,
  )
  brandLinks!: BrandParentCategoryBrand[];

  @OneToMany(
    () => ParentCategory,
    (parentCategory) => parentCategory.brandParentCategories,
  )
  parentCategories!: ParentCategory[];

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}