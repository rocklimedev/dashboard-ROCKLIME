import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { AssignRoleDto, CreateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';
import { ActivityLogService } from '../engagement/activity-log.service';
interface RequestContext {
    ip?: string;
    headers?: Record<string, any>;
}
export declare class RolesService {
    private readonly roleModel;
    private readonly permissionModel;
    private readonly rolePermissionModel;
    private readonly userModel;
    private readonly activityLog;
    constructor(roleModel: typeof Role, permissionModel: typeof Permission, rolePermissionModel: typeof RolePermission, userModel: typeof User, activityLog: ActivityLogService);
    create(dto: CreateRoleDto, actorId?: string, req?: RequestContext): Promise<Role>;
    findAll(): Promise<Role[]>;
    findOne(roleId: string): Promise<Role>;
    remove(roleId: string, actorId?: string, req?: RequestContext): Promise<{
        message: string;
    }>;
    updatePermissions(roleId: string, dto: UpdateRolePermissionsDto, actorId?: string, req?: RequestContext): Promise<Role>;
    assignPermissions(roleId: string, permissionIds: string[], actorId?: string, req?: RequestContext): Promise<Role>;
    removePermission(roleId: string, permissionId: string, actorId?: string, req?: RequestContext): Promise<Role>;
    assignRole(dto: AssignRoleDto, actorId?: string, req?: RequestContext): Promise<{
        success: boolean;
        user: User;
    }>;
    findRecent(): Promise<Role[]>;
}
export {};
