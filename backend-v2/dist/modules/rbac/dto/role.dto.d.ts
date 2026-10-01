export declare class CreateRoleDto {
    roleName: string;
}
export declare class UpdateRolePermissionsDto {
    permissionIds: string[];
}
export declare class AssignRoleDto {
    userId: string;
    role: string;
}
export declare class CreatePermissionDto {
    api: 'view' | 'delete' | 'write' | 'edit' | 'export';
    name: string;
    route: string;
    module: string;
}
