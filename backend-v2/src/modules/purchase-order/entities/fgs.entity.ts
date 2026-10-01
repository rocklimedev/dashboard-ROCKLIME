import { BelongsTo, Column, DataType, ForeignKey, HasOne, Model, Table } from 'sequelize-typescript';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { User } from '../../users/entities/user.entity';
import { PurchaseOrder } from './purchase-order.entity';

export const FGS_STATUSES = ['draft', 'negotiating', 'approved', 'converted', 'cancelled'] as const;

@Table({ tableName: 'field_guided_sheets', timestamps: true })
export class FieldGuidedSheet extends Model<FieldGuidedSheet> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id: string;

  @Column({ type: DataType.STRING(20), unique: true, allowNull: false })
  fgsNumber: string;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.UUID, allowNull: false })
  vendorId: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  userId: string;

  @Column({ type: DataType.ENUM(...FGS_STATUSES), defaultValue: 'draft' })
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

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'createdBy' })
  createdBy: User;

  @HasOne(() => PurchaseOrder, { foreignKey: 'fgsId', as: 'purchaseOrder' })
  purchaseOrder: PurchaseOrder;
}
