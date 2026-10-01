import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'roles', timestamps: true })
export class Role extends Model<Role> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  roleId: string;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  roleName: string;

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions: Permission[];

  @HasMany(() => RolePermission, { as: 'rolepermissions' })
  rolepermissions: RolePermission[];

  @HasMany(() => User, { as: 'users' })
  users: User[];
}
