import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Role } from '@/modules/roles/entities/role.entity';
import { Permission } from '@/modules/permissions/entities/permission.entity';

@Table({
  tableName: 'rolepermissions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['roleId', 'permissionId'],
    },
    {
      fields: ['permissionId'],
    },
  ],
})
export class RolePermission extends Model<RolePermission> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  roleId: string;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  permissionId: string;

  // -----------------------------------
  // Associations
  // -----------------------------------

  @BelongsTo(() => Role, {
    foreignKey: 'roleId',
    as: 'role',
  })
  role: Role;

  @BelongsTo(() => Permission, {
    foreignKey: 'permissionId',
    as: 'permission',
  })
  permission: Permission;
}
