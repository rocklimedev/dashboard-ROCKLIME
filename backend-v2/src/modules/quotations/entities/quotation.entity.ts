import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'quotations', timestamps: true })
export class Quotation extends Model<Quotation> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  quotationId: string;

  @Column({ type: DataType.STRING(255), allowNull: false, defaultValue: 'Quotation' })
  document_title: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  quotation_date: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  due_date: string;

  @Column({ type: DataType.JSON, allowNull: true })
  followupDates: string[];

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  reference_number: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  totalFloors: number;

  @Column({ type: DataType.JSON, allowNull: true, defaultValue: [] })
  floors: Record<string, any>[];

  @Column({ type: DataType.JSON, allowNull: false })
  products: Record<string, any>[];

  @ForeignKey(() => Customer)
  @Column({ type: DataType.UUID, allowNull: false })
  customerId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  shipTo: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  createdBy: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  extraDiscount: number;

  @Column({ type: DataType.ENUM('percent', 'fixed'), allowNull: true, defaultValue: 'percent' })
  extraDiscountType: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  discountAmount: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  shippingAmount: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true, defaultValue: 0 })
  gst: number;

  // NOTE: gstAmount/optionalTotal/optionalItemsCount are referenced
  // throughout quotation.service.js (create/update/clone/versioning) but
  // were absent from the legacy Sequelize model file - Sequelize silently
  // drops unknown attributes on create/update, so this was very likely a
  // latent bug upstream (values computed but never persisted). Added here
  // as real columns so the port is actually correct.
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  gstAmount: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  optionalTotal: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  optionalItemsCount: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: true, defaultValue: 0 })
  roundOff: number;

  @Column({ type: DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 })
  finalAmount: number;

  @Column({ type: DataType.STRING(255), allowNull: true })
  signature_name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  signature_image: string;

  @Column({
    type: DataType.ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED'),
    allowNull: false,
    defaultValue: 'DRAFT',
  })
  status: string;

  @BelongsTo(() => Customer, { foreignKey: 'customerId', as: 'customer' })
  customer: Customer;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  creator: User;
}
