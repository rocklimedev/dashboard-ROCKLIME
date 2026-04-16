import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Brand } from '../../brands/entities/brand.entity';
import { ParentCategory } from './parent-category.entity';
import { Keyword } from './keywords.entity';

@Entity('categories')
@Index(['brandId'])
@Index(['parentCategoryId'])
@Index(['slug'], { unique: true })
@Index(['name', 'brandId'], { unique: true }) // same as Sequelize
export class Category {
  @PrimaryGeneratedColumn('uuid')
  categoryId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => Brand, (brand) => brand.categories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ type: 'uuid' })
  brandId: string;

  @ManyToOne(
    () => ParentCategory,
    (parentCategory) => parentCategory.categories,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'parentCategoryId' })
  parentCategory: ParentCategory;

  @Column({ type: 'uuid', nullable: true })
  parentCategoryId: string;

  @OneToMany(() => Keyword, (keyword) => keyword.category)
  keywords: Keyword[];

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}