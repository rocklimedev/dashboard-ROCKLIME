export declare const PERMISSION_KEY = "permission";
export interface RequiredPermission {
    api: 'view' | 'delete' | 'write' | 'edit' | 'export';
    name: string;
    module: string;
    route: string;
}
export declare const RequirePermission: (permission: RequiredPermission) => import("@nestjs/common").CustomDecorator<string>;
