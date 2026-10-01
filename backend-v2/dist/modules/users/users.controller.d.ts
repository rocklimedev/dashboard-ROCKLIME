import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<import("./entities/user.entity").User>;
    updateProfile(userId: string, dto: UpdateUserDto): Promise<import("./entities/user.entity").User>;
    findAll(): Promise<import("./entities/user.entity").User[]>;
    createUser(dto: CreateUserDto, actorId: string, req: Request): Promise<import("./entities/user.entity").User | null>;
    updateUser(userId: string, dto: UpdateUserDto): Promise<import("./entities/user.entity").User>;
    deleteUser(userId: string, actorId: string, req: Request): Promise<{
        message: string;
    }>;
    updateStatus(userId: string, status: string, actorId: string, req: Request): Promise<{
        message: string;
        status: string;
    }>;
    assignRole(userId: string, roleId: string, actorId: string, req: Request): Promise<{
        message: string;
        user: import("./entities/user.entity").User;
    }>;
}
