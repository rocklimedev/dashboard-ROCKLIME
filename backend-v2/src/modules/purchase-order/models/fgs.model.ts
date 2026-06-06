import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasOne,
} from 'sequelize-typescript';

import { Vendor } from '@/modules/vendors/entities/vendor.entity';
import { User } from '@/modules/users/entities/user.entity';
import { PurchaseOrder } from '@/modules/purchase-orders/entities/purchase-order.entity';

export enum FieldGuidedSheetStatus {
  DRAFT = 'draft',
  NEGOTIATING = 'negotiating',
  APPROVED = 'approved',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled',
}

@Table({
  tableName: 'field_guided_sheets',
  timestamps: true,
})
export class FieldGuidedSheet extends Model<FieldGuidedSheet> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  fgsNumber: string;

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

  @Default(FieldGuidedSheetStatus.DRAFT)
  @Column({
    type: DataType.ENUM(...Object.values(FieldGuidedSheetStatus)),
    allowNull: false,
  })
  status: FieldGuidedSheetStatus;

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

  // =====================================
  // Associations
  // =====================================

  @BelongsTo(() => Vendor, {
    foreignKey: 'vendorId',
    as: 'vendor',
  })
  vendor: Vendor;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    as: 'createdBy',
  })
  createdBy: User;

  @HasOne(() => PurchaseOrder, {
    foreignKey: 'fgsId',
    as: 'purchaseOrder',
  })
  purchaseOrder: PurchaseOrder;
}
