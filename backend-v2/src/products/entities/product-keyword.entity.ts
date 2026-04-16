import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';
import { Keyword } from 'src/categories/entities/keywords.entity';
@Entity('products_keywords')
@Index(['productId'])
@Index(['keywordId'])
@Index(['productId', 'keywordId'], { unique: true })
export class ProductKeyword {
  @PrimaryColumn('uuid')
  productId: string;

  @PrimaryColumn('uuid')
  keywordId: string;

  @ManyToOne(() => Product, (product) => product.product_keywords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Keyword, (keyword) => keyword.productKeywordMappings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'keywordId' })
  keyword: Keyword;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}