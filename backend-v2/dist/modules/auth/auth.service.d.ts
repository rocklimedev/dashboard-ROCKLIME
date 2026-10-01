import { Model as MongoModel } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { VerificationToken } from './schemas/verification-token.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivityLogService } from '../engagement/activity-log.service';
interface RequestContext {
    ip?: string;
    headers?: Record<string, any>;
}
export declare class AuthService {
    private readonly userModel;
    private readonly roleModel;
    private readonly verificationTokenModel;
    private readonly refreshTokenModel;
    private readonly jwtService;
    private readonly config;
    private readonly activityLog;
    constructor(userModel: typeof User, roleModel: typeof Role, verificationTokenModel: MongoModel<VerificationToken>, refreshTokenModel: MongoModel<RefreshToken>, jwtService: JwtService, config: ConfigService, activityLog: ActivityLogService);
    private signAccessToken;
    private signRefreshToken;
    login(dto: LoginDto, req?: RequestContext): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        user: {
            userId: string;
            email: string;
            username: string;
            name: string;
            mobileNumber: string;
            roles: string[];
            roleId: string;
            status: string;
            isEmailVerified: boolean;
        };
    }>;
    register(dto: RegisterDto, req?: RequestContext): Promise<{
        message: string;
        user: {
            userId: string;
            username: string;
            name: string;
            email: string;
            mobileNumber: string;
            roles: string[];
            roleId: string;
            status: string;
            createdAt: any;
            isEmailVerified: boolean;
        };
    }>;
    verifyAccount(token: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto, req?: RequestContext): Promise<{
        message: string;
    }>;
    deactivateAccount(userId: string, req?: RequestContext): Promise<{
        message: string;
    }>;
    getPermissionsForUser(userId: string): Promise<{
        role: string;
        permissions: Permission[];
    }>;
    validateToken(token: string): Promise<{
        valid: boolean;
        decoded: any;
    } | {
        valid: boolean;
        decoded?: undefined;
    }>;
}
export {};
