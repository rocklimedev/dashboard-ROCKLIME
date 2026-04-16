import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Brand } from '../../brands/entities/brand.entity';
import { ParentCategory } from 'src/categories/entities/parent-category.entity';
@Entity('brand_parentcategories')
@Index(['name'], { unique: true })
@Index(['slug'], { unique: true })
export class BrandParentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToMany(
    () => Brand,
    (brand) => brand.brandParentCategories,
  )
  brands: Brand[];

  @OneToMany(
    () => ParentCategory,
    (parentCategory) => parentCategory.brandParentCategory,
  )
  parentCategories: ParentCategory[];

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}