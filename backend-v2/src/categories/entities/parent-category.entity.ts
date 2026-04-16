import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { BrandParentCategory } from 'src/brands/entities/brand-parent-category.entity';
@Entity('parentcategories')
@Index(['name'], { unique: true })
@Index(['slug'], { unique: true })
export class ParentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @OneToMany(() => Category, (category) => category.parentCategory)
  categories: Category[];

  // M:N with Brand via BrandParentCategory
  @ManyToMany(() => Brand)
  brands: Brand[];

  @OneToMany(
    () => BrandParentCategory,
    (bpc) => bpc.parentCategory,
  )
  brandParentCategories: BrandParentCategory[];

  // ─────────────────────────────
  // Auto Slug (like Sequelize hook)
  // ─────────────────────────────

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.name && !this.slug) {
      this.slug = this.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '');
    }
  }

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}