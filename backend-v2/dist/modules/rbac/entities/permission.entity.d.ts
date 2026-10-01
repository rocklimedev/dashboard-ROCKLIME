import { Model } from 'sequelize-typescript';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';
export declare enum PermissionApi {
    VIEW = "view",
    DELETE = "delete",
    WRITE = "write",
    EDIT = "edit",
    EXPORT = "export"
}
export declare class Permission extends Model<Permission> {
    permissionId: string;
    api: PermissionApi;
    name: string;
    route: string;
    module: string;
    rolepermissionLinks: RolePermission[];
    roles: Role[];
}
