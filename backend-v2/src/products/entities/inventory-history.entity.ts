import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

import { v7 as uuidv7 } from 'uuid';

export enum InventoryAction {
  ADD_STOCK = 'add-stock',
  REMOVE_STOCK = 'remove-stock',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  CORRECTION = 'correction',
}

@Entity('inventory_history')
@Index('idx_product_created', ['productId', 'createdAt'])
@Index('idx_created_at', ['createdAt'])
@Index('idx_action', ['action'])
@Index('idx_user', ['userId'])
@Index('idx_order_no', ['orderNo'])
export class InventoryHistory {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ type: 'char', length: 36 })
  productId: string;

  @Column({ type: 'int' })
  change: number;

  @Column({ type: 'int' })
  quantityAfter: number;

  @Column({
    type: 'enum',
    enum: InventoryAction,
  })
  action: InventoryAction;

  @Column({ length: 50, nullable: true })
  orderNo: string;

  @Column({ type: 'char', length: 36, nullable: true })
  userId: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // ─────────────────────────────
  // Hooks
  // ─────────────────────────────

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7(); // time-ordered UUID
    }
  }

  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}