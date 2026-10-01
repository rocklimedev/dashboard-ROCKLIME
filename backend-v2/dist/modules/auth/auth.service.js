"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const sequelize_2 = require("sequelize");
const user_entity_1 = require("../users/entities/user.entity");
const role_entity_1 = require("../rbac/entities/role.entity");
const permission_entity_1 = require("../rbac/entities/permission.entity");
const verification_token_schema_1 = require("./schemas/verification-token.schema");
const refresh_token_schema_1 = require("./schemas/refresh-token.schema");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
let AuthService = class AuthService {
    constructor(userModel, roleModel, verificationTokenModel, refreshTokenModel, jwtService, config, activityLog) {
        this.userModel = userModel;
        this.roleModel = roleModel;
        this.verificationTokenModel = verificationTokenModel;
        this.refreshTokenModel = refreshTokenModel;
        this.jwtService = jwtService;
        this.config = config;
        this.activityLog = activityLog;
    }
    signAccessToken(user) {
        return this.jwtService.sign({
            userId: user.userId,
            email: user.email,
            roles: user.roles,
            roleId: user.roleId,
            iat: Math.floor(Date.now() / 1000),
        }, {
            secret: this.config.get('jwt.secret'),
            expiresIn: this.config.get('jwt.accessExpiresIn'),
        });
    }
    signRefreshToken(user) {
        return this.jwtService.sign({ userId: user.userId, email: user.email, roles: user.roles, roleId: user.roleId }, {
            secret: this.config.get('jwt.refreshSecret'),
            expiresIn: this.config.get('jwt.refreshExpiresIn'),
        });
    }
    async login(dto, req) {
        const user = await this.userModel.findOne({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user)
            throw new common_1.BadRequestException('Invalid credentials');
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid)
            throw new common_1.BadRequestException('Invalid credentials');
        const accessToken = this.signAccessToken(user);
        const refreshToken = this.signRefreshToken(user);
        this.activityLog
            .logActivity({
            userId: user.userId,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'LOGIN_SUCCESS',
            entityId: user.userId,
            entityName: user.name || user.username,
            description: `User "${user.username}" logged in successfully`,
            metadata: { email: user.email, role: user.roles, status: user.status },
            req,
        })
            .catch(() => { });
        return {
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                userId: user.userId,
                email: user.email,
                username: user.username,
                name: user.name,
                mobileNumber: user.mobileNumber,
                roles: user.roles,
                roleId: user.roleId,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
            },
        };
    }
    async register(dto, req) {
        const normalizedEmail = dto.email.toLowerCase();
        const existing = await this.userModel.findOne({
            where: {
                [sequelize_2.Op.or]: [{ username: dto.username }, { email: normalizedEmail }],
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Username or Email already exists');
        }
        const roleData = await this.roleModel.findOne({
            where: { roleName: user_entity_1.ROLES.Users },
        });
        if (!roleData)
            throw new common_1.BadRequestException('USERS role not found');
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const newUser = await this.userModel.create({
            username: dto.username,
            name: dto.name,
            email: normalizedEmail,
            mobileNumber: dto.mobileNumber ?? null,
            password: hashedPassword,
            roles: [roleData.roleName],
            roleId: roleData.roleId,
            status: 'inactive',
            isEmailVerified: false,
        });
        const verificationToken = this.jwtService.sign({ userId: newUser.userId }, { secret: this.config.get('jwt.secret'), expiresIn: '1d' });
        await this.verificationTokenModel.create({
            userId: newUser.userId,
            token: verificationToken,
            email: normalizedEmail,
            isVerified: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        this.activityLog
            .logActivity({
            userId: newUser.userId,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'USER_REGISTERED',
            entityId: newUser.userId,
            entityName: newUser.name || newUser.username,
            description: `New user "${newUser.username}" registered`,
            newValues: {
                userId: newUser.userId,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                mobileNumber: newUser.mobileNumber,
                role: roleData.roleName,
                status: newUser.status,
                isEmailVerified: newUser.isEmailVerified,
            },
            metadata: { registrationType: 'SELF_REGISTRATION', verificationEmailSent: true },
            req,
        })
            .catch(() => { });
        return {
            message: 'User registered successfully. Verification email sent.',
            user: {
                userId: newUser.userId,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                mobileNumber: newUser.mobileNumber,
                roles: newUser.roles,
                roleId: newUser.roleId,
                status: newUser.status,
                createdAt: newUser.createdAt,
                isEmailVerified: newUser.isEmailVerified,
            },
        };
    }
    async verifyAccount(token) {
        const verification = await this.verificationTokenModel.findOne({ token });
        if (!verification)
            throw new common_1.BadRequestException('Invalid or expired token');
        if (verification.isVerified)
            throw new common_1.BadRequestException('Account already verified');
        if (verification.expiresAt < new Date()) {
            await this.verificationTokenModel.deleteOne({ token });
            throw new common_1.BadRequestException('Token has expired');
        }
        let decoded;
        try {
            decoded = this.jwtService.verify(token, {
                secret: this.config.get('jwt.secret'),
            });
        }
        catch (err) {
            await this.verificationTokenModel.deleteOne({ token });
            throw new common_1.BadRequestException(err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token');
        }
        const user = await this.userModel.findByPk(decoded.userId);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        user.isEmailVerified = true;
        user.status = 'active';
        await user.save();
        verification.isVerified = true;
        await verification.save();
        this.activityLog
            .logActivity({
            userId: user.userId,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'ACCOUNT_VERIFIED',
            entityId: user.userId,
            entityName: user.name || user.username,
            description: `Account verified for user "${user.username}"`,
            oldValues: { isEmailVerified: false, status: 'inactive' },
            newValues: { isEmailVerified: true, status: 'active' },
        })
            .catch(() => { });
        return { message: 'Account verified successfully' };
    }
    async refreshToken(refreshToken) {
        if (!refreshToken)
            throw new common_1.UnauthorizedException('No refresh token provided');
        let decoded;
        try {
            decoded = this.jwtService.verify(refreshToken, {
                secret: this.config.get('jwt.refreshSecret'),
            });
        }
        catch {
            throw new common_1.ForbiddenException('Invalid or expired refresh token');
        }
        const user = await this.userModel.findByPk(decoded.userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return { accessToken: this.signAccessToken(user) };
    }
    async changePassword(userId, dto, req) {
        const user = await this.userModel.findByPk(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const valid = await bcrypt.compare(dto.oldPassword, user.password);
        if (!valid)
            throw new common_1.BadRequestException('Old password is incorrect');
        if (dto.oldPassword === dto.newPassword) {
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        if (dto.newPassword.length < 8) {
            throw new common_1.BadRequestException('New password must be at least 8 characters long');
        }
        if (user.status !== 'active') {
            throw new common_1.ForbiddenException('Account is inactive or restricted');
        }
        user.password = await bcrypt.hash(dto.newPassword, 10);
        await user.save();
        this.activityLog
            .logActivity({
            userId: user.userId,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'PASSWORD_CHANGED',
            entityId: user.userId,
            entityName: user.name || user.username,
            description: `Password changed successfully for user "${user.username}"`,
            metadata: { email: user.email, changedBy: user.userId },
            req,
        })
            .catch(() => { });
        return { message: 'Password changed successfully' };
    }
    async deactivateAccount(userId, req) {
        const user = await this.userModel.findByPk(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.status === 'inactive') {
            throw new common_1.BadRequestException('Account is already deactivated');
        }
        if (user.roles?.includes(user_entity_1.ROLES.SuperAdmin)) {
            throw new common_1.ForbiddenException('SuperAdmin account cannot be deactivated');
        }
        const oldStatus = user.status;
        user.status = 'inactive';
        await user.save();
        this.activityLog
            .logActivity({
            userId: user.userId,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'ACCOUNT_DEACTIVATED',
            entityId: user.userId,
            entityName: user.name || user.username,
            description: `Account deactivated by user "${user.username}"`,
            oldValues: { status: oldStatus },
            newValues: { status: 'inactive' },
            metadata: { email: user.email, deactivatedBy: user.userId, selfDeactivated: true },
            req,
        })
            .catch(() => { });
        return {
            message: 'Account deactivated successfully. You can reactivate by logging in again.',
        };
    }
    async getPermissionsForUser(userId) {
        const user = await this.userModel.findByPk(userId, {
            include: [{ model: role_entity_1.Role, include: [{ model: permission_entity_1.Permission }] }],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const role = user.role;
        return {
            role: role?.roleName ?? null,
            permissions: role?.permissions ?? [],
        };
    }
    async validateToken(token) {
        try {
            const decoded = this.jwtService.verify(token, {
                secret: this.config.get('jwt.secret'),
            });
            return { valid: true, decoded };
        }
        catch {
            return { valid: false };
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(user_entity_1.User)),
    __param(1, (0, sequelize_1.InjectModel)(role_entity_1.Role)),
    __param(2, (0, mongoose_1.InjectModel)(verification_token_schema_1.VerificationToken.name)),
    __param(3, (0, mongoose_1.InjectModel)(refresh_token_schema_1.RefreshToken.name)),
    __metadata("design:paramtypes", [Object, Object, mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService,
        activity_log_service_1.ActivityLogService])
], AuthService);
//# sourceMappingURL=auth.service.js.map