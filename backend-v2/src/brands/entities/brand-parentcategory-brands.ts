import {
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

import { Brand } from '../../brands/entities/brand.entity';
import { BrandParentCategory } from './brand-parent-category.entity';

@Entity('brand_parentcategory_brands')
@Index(['brandId'])
@Index(['brandParentCategoryId'])
export class BrandParentCategoryBrand {
  // ─────────────────────────────
  // Composite Primary Keys
  // ─────────────────────────────
  @PrimaryColumn('uuid')
  brandId!: string;

  @PrimaryColumn('uuid')
  brandParentCategoryId!: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand!: Brand;

  @ManyToOne(() => BrandParentCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandParentCategoryId' })
  brandParentCategory!: BrandParentCategory;
}