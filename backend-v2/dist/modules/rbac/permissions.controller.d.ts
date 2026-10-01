import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/role.dto';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    create(dto: CreatePermissionDto): Promise<import("./entities/permission.entity").Permission>;
    findAll(): Promise<import("./entities/permission.entity").Permission[]>;
    findOne(permissionId: string): Promise<import("./entities/permission.entity").Permission>;
    update(permissionId: string, dto: Partial<CreatePermissionDto>): Promise<import("./entities/permission.entity").Permission>;
    remove(permissionId: string): Promise<{
        message: string;
    }>;
}
