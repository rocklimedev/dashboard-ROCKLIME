import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';

import { Permission } from '@/modules/permissions/entities/permission.entity';
import { RolePermission } from '@/modules/roles/entities/role-permission.entity';
import { User } from '@/modules/users/entities/user.entity';

@Table({
  tableName: 'roles',
  timestamps: true,
})
export class Role extends Model<Role> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  roleId: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  roleName: string;

  // -----------------------------------
  // Associations
  // -----------------------------------

  @BelongsToMany(() => Permission, {
    through: () => RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions',
  })
  permissions: Permission[];

  @HasMany(() => RolePermission, {
    foreignKey: 'roleId',
    as: 'rolepermissions',
  })
  rolepermissions: RolePermission[];

  @HasMany(() => User, {
    foreignKey: 'roleId',
    as: 'users',
  })
  users: User[];
}
