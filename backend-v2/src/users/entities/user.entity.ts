import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from 'src/rbac/entities/role.entity';
import { Address } from 'src/address/entities/address.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { FieldGuidedSheet } from 'src/purchase-orders/entities/field-guided-sheet.entity';
import { Order } from '../../orders/entities/order.entity';
import { Quotation } from '../../quotations/entities/quotation.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RESTRICTED = 'restricted',
}

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
}

@Entity('users')
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ length: 50 })
  username: string;

  @Column({ nullable: true })
  name: string;

  @Column({ length: 100 })
  email: string;

  @Column({ nullable: true })
  mobileNumber: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'time', nullable: true })
  shiftFrom: string;

  @Column({ type: 'time', nullable: true })
  shiftTo: string;

  @Column({
    type: 'enum',
    enum: BloodGroup,
    nullable: true,
  })
  bloodGroup: BloodGroup;

  // ─────────────────────────────
  // Address
  // ─────────────────────────────

  @Column({ nullable: true })
  addressId: string;

  @OneToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @Column({ nullable: true })
  emergencyNumber: string;

  // ─────────────────────────────
  // Role (CORE RBAC)
  // ─────────────────────────────

  @Column()
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  // ─────────────────────────────

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  photo_thumbnail: string;

  @Column({ nullable: true })
  photo_original: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INACTIVE,
  })
  status: UserStatus;

  @Column()
  password: string;

  // ─────────────────────────────
  // Relations
  // ─────────────────────────────

  @OneToMany(() => PurchaseOrder, (po) => po.createdBy)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(() => FieldGuidedSheet, (fgs) => fgs.createdBy)
  fieldGuidedSheets: FieldGuidedSheet[];

  @OneToMany(() => Order, (order) => order.creator)
  createdOrders: Order[];

  @OneToMany(() => Order, (order) => order.assignedUser)
  assignedOrders: Order[];

  @OneToMany(() => Order, (order) => order.secondaryUser)
  secondaryOrders: Order[];

  @OneToMany(() => Quotation, (q) => q.creator)
  quotations: Quotation[];

  // ─────────────────────────────

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}