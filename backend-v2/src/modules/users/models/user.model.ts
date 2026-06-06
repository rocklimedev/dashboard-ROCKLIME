import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
  BelongsToMany,
  BeforeCreate,
} from 'sequelize-typescript';

import { Op } from 'sequelize';

import { Role } from '@/modules/roles/entities/role.entity';
import { Address } from '@/modules/addresses/entities/address.entity';
import { Order } from '@/modules/orders/entities/order.entity';
import { PurchaseOrder } from '@/modules/purchase-orders/entities/purchase-order.entity';
import { FieldGuidedSheet } from '@/modules/field-guided-sheets/entities/field-guided-sheet.entity';
import { Team } from '@/modules/teams/entities/team.entity';
import { TeamMember } from '@/modules/teams/entities/team-member.entity';
import { Quotation } from '@/modules/quotations/entities/quotation.entity';

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

export enum SystemRoles {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  ACCOUNTS = 'ACCOUNTS',
  DEVELOPER = 'DEVELOPER',
  USERS = 'USERS',
  SALES = 'SALES',
}

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model<User> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  userId: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  username: string;

  @Column(DataType.STRING(100))
  name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column(DataType.STRING(20))
  mobileNumber: string;

  @Column({
    type: DataType.DATEONLY,
    validate: { isDate: true },
  })
  dateOfBirth: Date;

  @Column(DataType.TIME)
  shiftFrom: string;

  @Column(DataType.TIME)
  shiftTo: string;

  @Column({
    type: DataType.ENUM(...Object.values(BloodGroup)),
  })
  bloodGroup: BloodGroup;

  @ForeignKey(() => Address)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  addressId: string;

  @Column({
    type: DataType.STRING(20),
  })
  emergencyNumber: string;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  roleId: string;

  @Column({
    type: DataType.STRING,
    defaultValue: SystemRoles.USERS,
    get() {
      const raw = this.getDataValue('roles');
      return raw?.split(',') || [];
    },
    set(value: string | string[]) {
      this.setDataValue(
        'roles',
        Array.isArray(value) ? value.join(',') : value,
      );
    },
  })
  roles: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isEmailVerified: boolean;

  @Column(DataType.STRING(255))
  photo_thumbnail: string;

  @Column(DataType.STRING(255))
  photo_original: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    defaultValue: UserStatus.INACTIVE,
  })
  status: UserStatus;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  // -----------------------------------
  // HOOKS
  // -----------------------------------

  @BeforeCreate
  static async checkSuperAdminLimit(instance: User) {
    if (instance.roles?.includes(SystemRoles.SUPER_ADMIN)) {
      const existing = await User.findOne({
        where: {
          roles: {
            [Op.like]: `%${SystemRoles.SUPER_ADMIN}%`,
          },
        },
      });

      if (existing) {
        throw new Error('A SuperAdmin already exists');
      }
    }
  }

  // -----------------------------------
  // ASSOCIATIONS
  // -----------------------------------

  @BelongsTo(() => Role, {
    foreignKey: 'roleId',
    as: 'role',
  })
  role: Role;

  @HasMany(() => PurchaseOrder, {
    foreignKey: 'userId',
    as: 'purchaseOrders',
  })
  purchaseOrders: PurchaseOrder[];

  @HasMany(() => FieldGuidedSheet, {
    foreignKey: 'userId',
    as: 'fieldGuidedSheets',
  })
  fieldGuidedSheets: FieldGuidedSheet[];

  @HasOne(() => Address, {
    foreignKey: 'userId',
    as: 'address',
  })
  address: Address;

  @BelongsToMany(() => Team, {
    through: () => TeamMember,
    foreignKey: 'userId',
    otherKey: 'teamId',
    as: 'teams',
  })
  teams: Team[];

  @HasMany(() => Order, {
    foreignKey: 'createdBy',
    as: 'createdOrders',
  })
  createdOrders: Order[];

  @HasMany(() => Order, {
    foreignKey: 'assignedUserId',
    as: 'assignedOrders',
  })
  assignedOrders: Order[];

  @HasMany(() => Order, {
    foreignKey: 'secondaryUserId',
    as: 'secondaryOrders',
  })
  secondaryOrders: Order[];

  @HasMany(() => Quotation, {
    foreignKey: 'createdBy',
    as: 'quotations',
  })
  quotations: Quotation[];
}
