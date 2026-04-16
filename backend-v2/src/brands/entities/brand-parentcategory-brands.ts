import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { BrandParentCategory } from './brand-parent-category.entity';
@Entity('brand_parentcategory_brands')
export class BrandParentCategoryBrand {
  @PrimaryColumn('uuid')
  brandId: string;

  @PrimaryColumn('uuid')
  brandParentCategoryId: string;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @ManyToOne(() => BrandParentCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandParentCategoryId' })
  brandParentCategory: BrandParentCategory;
}