import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { CartItem } from './cart-item.entity';

@Entity('carts')
@Index(['userId'], { unique: true }) // ✅ one cart per user
@Index(['customerId'])
export class Cart {
  // ─────────────────────────────
  // Primary Key
  // ─────────────────────────────
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ─────────────────────────────
  // Ownership
  // ─────────────────────────────
  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────
  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: false,
  })
  items!: CartItem[];

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}