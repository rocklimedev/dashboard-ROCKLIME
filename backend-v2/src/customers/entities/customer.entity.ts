import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity';
import { Address } from 'src/address/entities/address.entity';
import { Vendor } from 'src/vendors/entities/vendor.entity';
import { Quotation } from 'src/quotations/entities/quotation.entity';

export enum CustomerType {
  RETAIL = 'Retail',
  ARCHITECT = 'Architect',
  INTERIOR = 'Interior',
  BUILDER = 'Builder',
  CONTRACTOR = 'Contractor',
}

@Entity('customers')
@Index(['mobileNumber'])
@Index(['email'])
@Index(['isVendor'])
@Index(['customerType'])
@Index(['gstNumber'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  customerId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobileNumber: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone2: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  companyName: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.RETAIL,
    nullable: true,
  })
  customerType: CustomerType;

  // ⚠️ JSON field (MySQL supports it)
  @Column({ type: 'json', nullable: true })
  address: any;

  @Column({ type: 'boolean', default: false })
  isVendor: boolean;

  // ─────────────────────────────
  // Vendor Relation
  // ─────────────────────────────

  @ManyToOne(() => Vendor, (vendor) => vendor.customers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @Column({ type: 'uuid', nullable: true })
  vendorId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gstNumber: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @OneToMany(() => Order, (order) => order.customer)
  customerOrders: Order[];

  @OneToMany(() => Address, (address) => address.customer)
  addresses: Address[];

  @OneToMany(() => Invoice, (invoice) => invoice.customer, {
    cascade: true,
  })
  @OneToMany(() => Quotation, (quotation) => quotation.customer)
  customerQuotations: Quotation[];

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}