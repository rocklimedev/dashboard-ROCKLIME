import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { Category } from 'src/categories/entities/category.entity';
import { BrandParentCategory } from './brand-parent-category.entity';

@Entity('brands')
@Index(['brandName'], { unique: true })
@Index(['brandSlug'], { unique: true })
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  brandName: string;

  @Column({ type: 'varchar', length: 255 })
  brandSlug: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @OneToMany(() => Vendor, (vendor) => vendor.brand)
  vendors: Vendor[];

  @OneToMany(() => Category, (category) => category.brand)
  categories: Category[];

  @ManyToMany(
    () => BrandParentCategory,
    (bpc) => bpc.brands,
  )
  @JoinTable({
    name: 'brand_parentcategory_brands',
    joinColumn: { name: 'brandId', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'brandParentCategoryId',
      referencedColumnName: 'id',
    },
  })
  brandParentCategories: BrandParentCategory[];

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}