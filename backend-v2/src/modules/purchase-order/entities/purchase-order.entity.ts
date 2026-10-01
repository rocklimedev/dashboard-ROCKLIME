import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { User } from '../../users/entities/user.entity';
import { FieldGuidedSheet } from './fgs.entity';

export const PO_STATUSES = [
  'pending',
  'in_negotiation',
  'confirmed',
  'partial_delivered',
  'delivered',
  'cancelled',
] as const;

@Table({ tableName: 'purchase_orders', timestamps: true })
export class PurchaseOrder extends Model<PurchaseOrder> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ type: DataType.STRING(20), unique: true, allowNull: false })
  poNumber: string;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.UUID, allowNull: false })
  vendorId: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  userId: string;

  @ForeignKey(() => FieldGuidedSheet)
  @Column({ type: DataType.UUID, allowNull: true })
  fgsId: string;

  @Column({ type: DataType.ENUM(...PO_STATUSES), defaultValue: 'pending' })
  status: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  orderDate: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  expectDeliveryDate: Date;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0.0 })
  totalAmount: number;

  @Column({ type: DataType.STRING(24), allowNull: true, unique: true })
  mongoItemsId: string;

  @BelongsTo(() => Vendor, { foreignKey: 'vendorId', as: 'vendor' })
  vendor: Vendor;

  @BelongsTo(() => FieldGuidedSheet, { foreignKey: 'fgsId', as: 'fgs' })
  fgs: FieldGuidedSheet;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'createdBy' })
  createdBy: User;
}
