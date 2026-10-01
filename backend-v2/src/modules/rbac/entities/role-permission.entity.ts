import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Table({
  tableName: 'rolepermissions',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['roleId', 'permissionId'] },
    { fields: ['permissionId'] },
  ],
})
export class RolePermission extends Model<RolePermission> {
  @Column({
    type: DataType.CHAR(36),
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @ForeignKey(() => Role)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  roleId: string;

  @ForeignKey(() => Permission)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  permissionId: string;

  @BelongsTo(() => Role, { as: 'role' })
  role: Role;

  @BelongsTo(() => Permission, { as: 'permission' })
  permission: Permission;
}
