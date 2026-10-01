import { Model } from 'sequelize-typescript';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
export declare class RolePermission extends Model<RolePermission> {
    id: string;
    roleId: string;
    permissionId: string;
    role: Role;
    permission: Permission;
}
