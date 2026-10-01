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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const bcrypt = require("bcrypt");
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("../rbac/entities/role.entity");
const address_entity_1 = require("../address/entities/address.entity");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
const excludeSensitiveFields = { attributes: { exclude: ['password'] } };
let UsersService = class UsersService {
    constructor(userModel, addressModel, activityLog) {
        this.userModel = userModel;
        this.addressModel = addressModel;
        this.activityLog = activityLog;
    }
    async getProfile(userId) {
        const user = await this.userModel.findByPk(userId, {
            include: [role_entity_1.Role],
            attributes: { exclude: ['password'] },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateProfile(userId, dto) {
        const user = await this.userModel.findByPk(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        await user.update(dto);
        return this.getProfile(userId);
    }
    findAll() {
        return this.userModel.findAll({
            include: [role_entity_1.Role],
            attributes: { exclude: ['password'] },
        });
    }
    async createUser(dto, actorId, req) {
        const existing = await this.userModel.findOne({
            where: { [sequelize_2.Op.or]: [{ username: dto.username }, { email: dto.email }] },
        });
        if (existing)
            throw new common_1.BadRequestException('Username or Email already exists');
        let roleData = null;
        if (dto.roleId) {
            roleData = await role_entity_1.Role.findOne({ where: { roleId: dto.roleId } });
            if (!roleData)
                throw new common_1.BadRequestException('Invalid role specified');
        }
        if (dto.addressId) {
            const address = await this.addressModel.findByPk(dto.addressId);
            if (!address)
                throw new common_1.BadRequestException('Invalid address ID');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const newUser = await this.userModel.create({
            ...dto,
            email: dto.email.toLowerCase(),
            password: hashedPassword,
            roles: roleData ? [roleData.roleName] : undefined,
            status: roleData?.roleName === 'Users' ? 'inactive' : 'active',
        });
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'USER_CREATED',
            entityId: newUser.userId,
            entityName: newUser.name || newUser.username,
            description: `User "${newUser.username}" was created`,
            newValues: {
                userId: newUser.userId,
                username: newUser.username,
                email: newUser.email,
                role: roleData?.roleName ?? null,
                status: newUser.status,
            },
            metadata: { roleId: dto.roleId ?? null, addressId: dto.addressId ?? null },
            req,
        })
            .catch(() => { });
        return this.userModel.findByPk(newUser.userId, excludeSensitiveFields);
    }
    async updateUser(userId, dto) {
        return this.updateProfile(userId, dto);
    }
    async deleteUser(userId, actorId, req) {
        const user = await this.userModel.findByPk(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const snapshot = {
            userId: user.userId,
            username: user.username,
            name: user.name,
            email: user.email,
        };
        await user.destroy();
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'USER_DELETED',
            entityId: snapshot.userId,
            entityName: snapshot.name || snapshot.username,
            description: `User "${snapshot.username}" was deleted`,
            oldValues: snapshot,
            req,
        })
            .catch(() => { });
        return { message: 'User deleted' };
    }
    async updateStatus(userId, status, actorId, req) {
        const user = await this.userModel.findByPk(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (actorId === userId) {
            throw new common_1.ForbiddenException('You cannot change your own status');
        }
        if (user.roles?.includes(user_entity_1.ROLES.SuperAdmin) && status !== 'active') {
            const superAdminCount = await this.userModel.count({
                where: { roles: { [sequelize_2.Op.like]: `%${user_entity_1.ROLES.SuperAdmin}%` } },
            });
            if (superAdminCount <= 1) {
                throw new common_1.BadRequestException('Cannot deactivate or restrict the only SuperAdmin');
            }
        }
        const oldStatus = user.status;
        user.status = status;
        await user.save();
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'USER_STATUS_UPDATED',
            entityId: user.userId,
            entityName: user.name || user.username,
            description: `Status for user "${user.username}" changed from ${oldStatus} to ${status}`,
            oldValues: { status: oldStatus },
            newValues: { status },
            req,
        })
            .catch(() => { });
        return { message: 'User status updated successfully', status: user.status };
    }
    async assignRole(userId, roleId, actorId, req) {
        const user = await this.userModel.findByPk(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const roleData = await role_entity_1.Role.findOne({ where: { roleId } });
        if (!roleData)
            throw new common_1.BadRequestException('Invalid role specified');
        const oldRole = user.roles;
        const oldRoleId = user.roleId;
        const oldStatus = user.status;
        user.roles = [roleData.roleName];
        user.roleId = roleData.roleId;
        user.status = roleData.roleName === 'Users' ? 'inactive' : 'active';
        await user.save();
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'USER_ROLE_ASSIGNED',
            entityId: user.userId,
            entityName: user.name || user.username,
            description: `Role "${roleData.roleName}" assigned to user "${user.username}"`,
            oldValues: { roles: oldRole, roleId: oldRoleId, status: oldStatus },
            newValues: { roles: user.roles, roleId: user.roleId, status: user.status },
            req,
        })
            .catch(() => { });
        return { message: 'Role assigned successfully', user: await this.getProfile(userId) };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(user_entity_1.User)),
    __param(1, (0, sequelize_1.InjectModel)(address_entity_1.Address)),
    __metadata("design:paramtypes", [Object, Object, activity_log_service_1.ActivityLogService])
], UsersService);
//# sourceMappingURL=users.service.js.map