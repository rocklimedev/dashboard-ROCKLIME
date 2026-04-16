// src/roles/entities/role.entity.ts
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
import { User } from 'src/users/entities/user.entity';

@Entity('roles')
@Index(['roleName'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  roleId: string;

  @Column({ type: 'varchar', length: 100 })
  roleName: string;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}