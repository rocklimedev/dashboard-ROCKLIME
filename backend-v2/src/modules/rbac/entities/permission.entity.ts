import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';

export enum PermissionApi {
  VIEW = 'view',
  DELETE = 'delete',
  WRITE = 'write',
  EDIT = 'edit',
  EXPORT = 'export',
}

@Table({ tableName: 'permissions', timestamps: true })
export class Permission extends Model<Permission> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  permissionId: string;

  @Column({
    type: DataType.ENUM(...Object.values(PermissionApi)),
    allowNull: false,
  })
  api: PermissionApi;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  route: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  module: string;

  @HasMany(() => RolePermission, { as: 'rolepermission_links' })
  rolepermissionLinks: RolePermission[];

  @BelongsToMany(() => Role, () => RolePermission)
  roles: Role[];
}
