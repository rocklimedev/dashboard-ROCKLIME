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

import { Role } from '@/modules/roles/entities/role.entity';
import { RolePermission } from '@/modules/roles/entities/role-permission.entity';

export enum PermissionApi {
  VIEW = 'view',
  DELETE = 'delete',
  WRITE = 'write',
  EDIT = 'edit',
  EXPORT = 'export',
}

@Table({
  tableName: 'permissions',
  timestamps: true,
})
export class Permission extends Model<Permission> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  permissionId: string;

  @Column({
    type: DataType.ENUM(...Object.values(PermissionApi)),
    allowNull: false,
  })
  api: PermissionApi;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  route: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  module: string;

  // -----------------------------------
  // Associations
  // -----------------------------------

  @HasMany(() => RolePermission, {
    foreignKey: 'permissionId',
    as: 'rolepermission_links',
  })
  rolepermission_links: RolePermission[];

  @BelongsToMany(() => Role, {
    through: () => RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles',
  })
  roles: Role[];
}
