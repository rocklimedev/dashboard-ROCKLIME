import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Address } from '../../address/entities/address.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';

@Table({
  tableName: 'customers',
  timestamps: true,
  indexes: [
    { fields: ['mobileNumber'] },
    { fields: ['email'] },
    { fields: ['isVendor'] },
    { fields: ['customerType'] },
    { fields: ['gstNumber'] },
  ],
})
export class Customer extends Model<Customer> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
    field: 'customerId',
  })
  customerId: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  email: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  mobileNumber: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  phone2: string;

  @Column({ type: DataType.STRING(150), allowNull: true })
  companyName: string;

  @Column({
    type: DataType.ENUM('Retail', 'Architect', 'Interior', 'Builder', 'Contractor'),
    allowNull: true,
    defaultValue: 'Retail',
  })
  customerType: string;

  @Column({ type: DataType.ENUM('Male', 'Female', 'Other'), allowNull: true })
  gender: string;

  @Column({ type: DataType.JSON, allowNull: true })
  address: Record<string, any>;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isVendor: boolean;

  // NOTE: no @BelongsTo yet for Brand - BrandsModule not migrated. Vendor
  // now has a real association below.
  @ForeignKey(() => Vendor)
  @Column({ type: DataType.UUID, allowNull: true })
  vendorId: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  gstNumber: string;

  @HasMany(() => Address, { foreignKey: 'customerId', as: 'addresses' })
  addresses: Address[];

  @BelongsTo(() => Vendor, { foreignKey: 'vendorId', as: 'vendor' })
  vendor: Vendor;

  // NOTE: customerOrders (hasMany Order) and customerQuotations (hasMany
  // Quotation) associations are declared on Order/Quotation instead (the
  // @BelongsTo side), to avoid a circular import between entity files.
}
