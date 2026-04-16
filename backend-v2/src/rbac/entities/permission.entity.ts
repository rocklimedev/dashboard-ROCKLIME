// src/permissions/entities/permission.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';
export enum PermissionApi {
  VIEW = 'view',
  DELETE = 'delete',
  WRITE = 'write',
  EDIT = 'edit',
  EXPORT = 'export',
}

@Entity('permissions')
@Index(['module'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  permissionId: string;

  @Column({ type: 'enum', enum: PermissionApi })
  api: PermissionApi;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  route: string;

  @Column({ type: 'varchar', length: 255 })
  module: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}