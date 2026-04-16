import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Customer } from 'src/customers/entities/customer.entity';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
export enum AddressStatus {
  BILLING = 'BILLING',
  PRIMARY = 'PRIMARY',
  ADDITIONAL = 'ADDITIONAL',
}

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  addressId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  street: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({
    type: 'enum',
    enum: AddressStatus,
    default: AddressStatus.ADDITIONAL,
  })
  status: AddressStatus;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @ManyToOne(() => User, (user) => user.addresses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => Customer, (customer) => customer.addresses, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  customer: Customer;

  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @OneToMany(() => Order, (order) => order.shippingAddress)
  orders: Order[];

  // ─────────────────────────────
  // Timestamps
  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}