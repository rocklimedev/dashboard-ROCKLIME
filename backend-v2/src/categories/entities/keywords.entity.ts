import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductKeyword } from 'src/products/entities/product-keyword.entity';

@Entity('keywords')
@Index(['keyword'], { unique: true })
@Index(['categoryId'])
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  keyword: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => Category, (category) => category.keywords, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  // M:N with Product
  @ManyToMany(() => Product, (product) => product.keywords)
  products: Product[];

  // Direct access to join table
  @OneToMany(
    () => ProductKeyword,
    (pk) => pk.keyword,
  )
  productKeywordMappings: ProductKeyword[];

  // ─────────────────────────────
  // Hooks (Sequelize → TypeORM)
  // ─────────────────────────────

  @BeforeInsert()
  @BeforeUpdate()
  normalizeKeyword() {
    if (this.keyword) {
      this.keyword = this.keyword.trim().toLowerCase();
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