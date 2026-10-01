import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    validateResetToken(token: string): Promise<{
        valid: boolean;
        decoded: any;
    } | {
        valid: boolean;
        decoded?: undefined;
    }>;
    verifyAccount(token: string): Promise<{
        message: string;
    }>;
    register(dto: RegisterDto, req: Request): Promise<{
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
    login(dto: LoginDto, res: Response, req: Request): Promise<{
        message: string;
        accessToken: string;
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
    logout(res: Response): {
        message: string;
    };
    changePassword(userId: string, dto: ChangePasswordDto, req: Request): Promise<{
        message: string;
    }>;
    refreshToken(req: Request): Promise<{
        accessToken: string;
    }>;
    getMyPermissions(userId: string): Promise<{
        role: string;
        permissions: import("../rbac/entities/permission.entity").Permission[];
    }>;
    deactivateAccount(userId: string, req: Request): Promise<{
        message: string;
    }>;
    validateToken(req: Request): Promise<{
        valid: boolean;
        decoded: any;
    } | {
        valid: boolean;
        decoded?: undefined;
    }>;
}
