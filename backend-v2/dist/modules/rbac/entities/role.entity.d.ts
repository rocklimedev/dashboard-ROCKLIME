import { Model } from 'sequelize-typescript';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { User } from '../../users/entities/user.entity';
export declare class Role extends Model<Role> {
    roleId: string;
    roleName: string;
    permissions: Permission[];
    rolepermissions: RolePermission[];
    users: User[];
}
