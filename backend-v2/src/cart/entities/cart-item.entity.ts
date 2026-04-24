import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Cart } from './cart.entity';

@Entity('cart_items')
@Index(['cartId'])
@Index(['productId'])
export class CartItem {
  // ─────────────────────────────
  // Primary Key
  // ─────────────────────────────
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ─────────────────────────────
  // Product Info (snapshot)
  // ─────────────────────────────
  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ nullable: true })
  name?: string;

  // ⚠️ decimal comes as string → use string type
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total?: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────
  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cartId' })
  cart!: Cart;

  @Column({ type: 'uuid' })
  cartId!: string;

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}