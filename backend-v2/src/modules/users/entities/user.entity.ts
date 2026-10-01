import {
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../rbac/entities/role.entity';
import { Address } from '../../address/entities/address.entity';

export const ROLES = {
  Admin: 'ADMIN',
  SuperAdmin: 'SUPER_ADMIN',
  Accounts: 'ACCOUNTS',
  Developer: 'DEVELOPER',
  Users: 'USERS',
  Sales: 'SALES',
} as const;

@Table({ tableName: 'users', timestamps: true })
export class User extends Model<User> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  })
  userId: string;

  @Column({ type: DataType.STRING(50), unique: true, allowNull: false })
  username: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  name: string;

  @Column({ type: DataType.STRING(100), unique: true, allowNull: false })
  email: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  mobileNumber: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  dateOfBirth: string;

  @Column({ type: DataType.TIME, allowNull: true })
  shiftFrom: string;

  @Column({ type: DataType.TIME, allowNull: true })
  shiftTo: string;

  @Column({
    type: DataType.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true,
  })
  bloodGroup: string;

  @ForeignKey(() => Address)
  @Column({ type: DataType.UUID, allowNull: true })
  addressId: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  emergencyNumber: string;

  @ForeignKey(() => Role)
  @Column({ type: DataType.UUID, allowNull: false })
  roleId: string;

  // Stored as a comma-separated string, exposed as string[] - same behaviour
  // as the legacy get()/set() pair on the Sequelize model.
  @Default(ROLES.Users)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    get(this: User) {
      const raw = this.getDataValue('roles' as any);
      return raw ? String(raw).split(',') : [];
    },
    set(this: User, value: string[] | string) {
      this.setDataValue(
        'roles' as any,
        Array.isArray(value) ? value.join(',') : value,
      );
    },
  })
  roles: string[];

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  isEmailVerified: boolean;

  @Column({ type: DataType.STRING(255), allowNull: true })
  photo_thumbnail: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  photo_original: string;

  @Default('inactive')
  @Column({ type: DataType.ENUM('active', 'inactive', 'restricted') })
  status: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @BelongsTo(() => Role, { as: 'role' })
  role: Role;

  @HasOne(() => Address, { as: 'address', foreignKey: 'userId' })
  address: Address;

  // NOTE: additional associations from the legacy model (purchaseOrders,
  // fieldGuidedSheets, teams, createdOrders, assignedOrders,
  // secondaryOrders, quotations) should be added here as those modules
  // are migrated - see docs/MIGRATION_PLAN.md.

  static ROLES = ROLES;

  @BeforeCreate
  static async assertSingleSuperAdmin(instance: User) {
    if (instance.roles?.includes(ROLES.SuperAdmin)) {
      const existing = await User.findOne({
        where: { roles: { [Op.like]: `%${ROLES.SuperAdmin}%` } } as any,
      });
      if (existing) {
        throw new Error('A SuperAdmin already exists');
      }
    }
  }
}
