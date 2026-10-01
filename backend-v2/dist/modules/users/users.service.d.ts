import { User } from './entities/user.entity';
import { Address } from '../address/entities/address.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { ActivityLogService } from '../engagement/activity-log.service';
interface RequestContext {
    ip?: string;
    headers?: Record<string, any>;
}
export declare class UsersService {
    private readonly userModel;
    private readonly addressModel;
    private readonly activityLog;
    constructor(userModel: typeof User, addressModel: typeof Address, activityLog: ActivityLogService);
    getProfile(userId: string): Promise<User>;
    updateProfile(userId: string, dto: UpdateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    createUser(dto: CreateUserDto, actorId?: string, req?: RequestContext): Promise<User | null>;
    updateUser(userId: string, dto: UpdateUserDto): Promise<User>;
    deleteUser(userId: string, actorId?: string, req?: RequestContext): Promise<{
        message: string;
    }>;
    updateStatus(userId: string, status: string, actorId: string, req?: RequestContext): Promise<{
        message: string;
        status: string;
    }>;
    assignRole(userId: string, roleId: string, actorId?: string, req?: RequestContext): Promise<{
        message: string;
        user: User;
    }>;
}
export {};
