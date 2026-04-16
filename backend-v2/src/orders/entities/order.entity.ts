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
import { User } from 'src/users/entities/user.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Address } from 'src/address/entities/address.entity';
import { Quotation } from 'src/quotations/entities/quotation.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PREPARING = 'PREPARING',
  CHECKING = 'CHECKING',
  INVOICE = 'INVOICE',
  DISPATCHED = 'DISPATCHED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  DELIVERED = 'DELIVERED',
  ONHOLD = 'ONHOLD',
  CANCELED = 'CANCELED',
  CLOSED = 'CLOSED',
}

export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('orders')
@Index(['orderNo'], { unique: true })
@Index(['status'])
@Index(['createdFor'])
@Index(['createdBy'])
@Index(['assignedUserId'])
@Index(['dueDate'])
@Index(['quotationId'])
@Index(['finalAmount'])
@Index(['createdAt'])
@Index(['status', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30 })
  orderNo: string;

  // 🔥 Instead of JSON → normalized relation
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'json', nullable: true })
  followupDates: any;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'createdFor' })
  customer: Customer;

  @Column()
  createdFor: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column()
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser: User;

  @Column({ nullable: true })
  assignedUserId: string;

  @Column({ nullable: true })
  assignedTeamId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'secondaryUserId' })
  secondaryUser: User;

  @Column({ nullable: true })
  secondaryUserId: string;

  @ManyToOne(() => Quotation, { nullable: true })
  @JoinColumn({ name: 'quotationId' })
  quotation: Quotation;

  @Column({ nullable: true })
  quotationId: string;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'shipTo' })
  shippingAddress: Address;

  @Column({ nullable: true })
  shipTo: string;

  // Self-referencing (pipeline + previous)
  @ManyToOne(() => Order, (order) => order.nextOrders, { nullable: true })
  @JoinColumn({ name: 'previousOrderNo', referencedColumnName: 'orderNo' })
  previousOrder: Order;

  @Column({ nullable: true })
  previousOrderNo: string;

  @OneToMany(() => Order, (order) => order.previousOrder)
  nextOrders: Order[];

  @ManyToOne(() => Order, (order) => order.pipelineOrders, { nullable: true })
  @JoinColumn({ name: 'masterPipelineNo', referencedColumnName: 'orderNo' })
  masterOrder: Order;

  @Column({ nullable: true })
  masterPipelineNo: string;

  @OneToMany(() => Order, (order) => order.masterOrder)
  pipelineOrders: Order[];

  // ─────────────────────────────
  // Financials
  // ─────────────────────────────

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shipping: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  gst: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  gstValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  extraDiscount: number;

  @Column({
    type: 'enum',
    enum: ['percent', 'fixed'],
    nullable: true,
  })
  extraDiscountType: 'percent' | 'fixed';

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  extraDiscountValue: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  finalAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ length: 500, nullable: true })
  gatePassLink: string;

  @Column({ length: 500, nullable: true })
  invoiceLink: string;

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}