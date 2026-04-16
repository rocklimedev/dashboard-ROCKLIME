// src/purchase-orders/entities/purchase-order.entity.ts
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
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { FieldGuidedSheet } from './field-guided-sheet.entity';
import { User } from 'src/users/entities/user.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum POStatus {
  PENDING = 'pending',
  IN_NEGOTIATION = 'in_negotiation',
  CONFIRMED = 'confirmed',
  PARTIAL_DELIVERED = 'partial_delivered',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('purchase_orders')
@Index(['poNumber'], { unique: true })
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  poNumber: string;

  @Column()
  vendorId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  fgsId: string;

  @Column({
    type: 'enum',
    enum: POStatus,
    default: POStatus.PENDING,
  })
  status: POStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  orderDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectDeliveryDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  // Relations
  @ManyToOne(() => Vendor, { nullable: false })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @ManyToOne(() => FieldGuidedSheet, (fgs) => fgs.purchaseOrders, {
    nullable: true,
  })
  @JoinColumn({ name: 'fgsId' })
  fgs: FieldGuidedSheet;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  createdBy: User;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: true,
    eager: false,
  })
  items: PurchaseOrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}