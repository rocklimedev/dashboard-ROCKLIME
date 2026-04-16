// src/field-guided-sheets/entities/field-guided-sheet.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { User } from 'src/users/entities/user.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { FgsItem } from './fgs-item.entity';
export enum FGSStatus {
  DRAFT = 'draft',
  NEGOTIATING = 'negotiating',
  APPROVED = 'approved',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled',
}

@Entity('field_guided_sheets')
@Index(['fgsNumber'], { unique: true })
export class FieldGuidedSheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20, unique: true })
  fgsNumber: string;

  @Column()
  vendorId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: FGSStatus,
    default: FGSStatus.DRAFT,
  })
  status: FGSStatus;

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

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  createdBy: User;

  @OneToMany(() => FgsItem, (item) => item.fgs, {
    cascade: true,
  })
  items: FgsItem[];

  @OneToMany(() => PurchaseOrder, (po) => po.fgs)
  purchaseOrders: PurchaseOrder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}