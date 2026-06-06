import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Vendor } from '@/modules/vendors/entities/vendor.entity';
import { FieldGuidedSheet } from '@/modules/field-guided-sheets/entities/field-guided-sheet.entity';
import { User } from '@/modules/users/entities/user.entity';

export enum PurchaseOrderStatus {
  PENDING = 'pending',
  IN_NEGOTIATION = 'in_negotiation',
  CONFIRMED = 'confirmed',
  PARTIAL_DELIVERED = 'partial_delivered',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Table({
  tableName: 'purchase_orders',
  timestamps: true,
})
export class PurchaseOrder extends Model<PurchaseOrder> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  poNumber: string;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  vendorId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId: string;

  @ForeignKey(() => FieldGuidedSheet)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  fgsId: string;

  @Default(PurchaseOrderStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(PurchaseOrderStatus)),
    allowNull: false,
  })
  status: PurchaseOrderStatus;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
  })
  orderDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  expectDeliveryDate: Date;

  @Default(0.0)
  @Column({
    type: DataType.DECIMAL(12, 2),
  })
  totalAmount: number;

  @Column({
    type: DataType.STRING(24),
    allowNull: true,
    unique: true,
  })
  mongoItemsId: string;

  // -----------------------------------
  // ASSOCIATIONS
  // -----------------------------------

  @BelongsTo(() => Vendor, {
    foreignKey: 'vendorId',
    as: 'vendor',
  })
  vendor: Vendor;

  @BelongsTo(() => FieldGuidedSheet, {
    foreignKey: 'fgsId',
    as: 'fgs',
  })
  fgs: FieldGuidedSheet;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    targetKey: 'userId',
    as: 'createdBy',
  })
  createdBy: User;
}
