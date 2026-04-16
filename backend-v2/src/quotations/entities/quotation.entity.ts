import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Address } from 'src/address/entities/address.entity';
import { Order } from '../../orders/entities/order.entity';
import { QuotationItem } from './quotation-item.entity';
import { QuotationVersion } from './quotation-version.entity';

@Entity('quotations')
@Index(['quotationId'], { unique: true })
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  quotationId: string;

  @Column()
  document_title: string;

  @Column({ type: 'date' })
  quotation_date: Date;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ type: 'json', nullable: true })
  followupDates: any;

  @Column({ nullable: true })
  reference_number: string;

  // ─────────────────────────────
  // Floors (KEEP JSON)
  // ─────────────────────────────

  @Column({ type: 'int', default: 0 })
  totalFloors: number;

  @Column({ type: 'json', default: [] })
  floors: any[];

  // ─────────────────────────────

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  roundOff: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  finalAmount: number;

  @Column({ nullable: true })
  signature_name: string;

  @Column({ type: 'text', nullable: true })
  signature_image: string;

  // ─────────────────────────────
  // Pricing extras
  // ─────────────────────────────

  @Column({ type: 'decimal', nullable: true })
  extraDiscount: number;

  @Column({
    type: 'enum',
    enum: ['percent', 'fixed'],
    nullable: true,
  })
  extraDiscountType: 'percent' | 'fixed';

  @Column({ type: 'decimal', nullable: true })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gst: number;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ nullable: true })
  createdBy: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: string;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'shipTo' })
  shippingAddress: Address;

  @Column({ nullable: true })
  shipTo: string;

  @OneToMany(() => Order, (order) => order.quotation)
  orders: Order[];

  @OneToMany(() => QuotationItem, (item) => item.quotation, {
    cascade: true,
  })
  items: QuotationItem[];

  @OneToMany(() => QuotationVersion, (v) => v.quotation)
  versions: QuotationVersion[];

  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}