import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/role.dto';
export declare class PermissionsService {
    private readonly permissionModel;
    constructor(permissionModel: typeof Permission);
    create(dto: CreatePermissionDto): Promise<Permission>;
    findAll(): Promise<Permission[]>;
    findOne(permissionId: string): Promise<Permission>;
    update(permissionId: string, dto: Partial<CreatePermissionDto>): Promise<Permission>;
    remove(permissionId: string): Promise<{
        message: string;
    }>;
}
