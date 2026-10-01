import { Request } from 'express';
import { RolesService } from './roles.service';
import { AssignRoleDto, CreateRoleDto, UpdateRolePermissionsDto } from './dto/role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(dto: CreateRoleDto, actorId: string, req: Request): Promise<import("./entities/role.entity").Role>;
    findAll(): Promise<import("./entities/role.entity").Role[]>;
    findRecent(): Promise<import("./entities/role.entity").Role[]>;
    findOne(roleId: string): Promise<import("./entities/role.entity").Role>;
    updatePermissions(roleId: string, dto: UpdateRolePermissionsDto, actorId: string, req: Request): Promise<import("./entities/role.entity").Role>;
    remove(roleId: string, actorId: string, req: Request): Promise<{
        message: string;
    }>;
    assignPermissions(roleId: string, permissionIds: string[], actorId: string, req: Request): Promise<import("./entities/role.entity").Role>;
    removePermission(roleId: string, permissionId: string, actorId: string, req: Request): Promise<import("./entities/role.entity").Role>;
    assignRole(dto: AssignRoleDto, actorId: string, req: Request): Promise<{
        success: boolean;
        user: import("../users/entities/user.entity").User;
    }>;
}
