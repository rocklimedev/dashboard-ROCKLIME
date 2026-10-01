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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("./entities/permission.entity");
const role_permission_entity_1 = require("./entities/role-permission.entity");
const user_entity_1 = require("../users/entities/user.entity");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
let RolesService = class RolesService {
    constructor(roleModel, permissionModel, rolePermissionModel, userModel, activityLog) {
        this.roleModel = roleModel;
        this.permissionModel = permissionModel;
        this.rolePermissionModel = rolePermissionModel;
        this.userModel = userModel;
        this.activityLog = activityLog;
    }
    async create(dto, actorId, req) {
        const newRole = await this.roleModel.create(dto);
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.SYSTEM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.ROLE,
            action: 'CREATE_ROLE',
            entityId: newRole.roleId,
            entityName: newRole.roleName,
            description: `Role "${newRole.roleName}" created`,
            metadata: { roleId: newRole.roleId, roleName: newRole.roleName, createdVia: 'ADMIN_PANEL' },
            req,
        })
            .catch(() => { });
        return newRole;
    }
    findAll() {
        return this.roleModel.findAll({ include: [permission_entity_1.Permission] });
    }
    async findOne(roleId) {
        const role = await this.roleModel.findByPk(roleId, {
            include: [permission_entity_1.Permission],
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async remove(roleId, actorId, req) {
        const role = await this.findOne(roleId);
        const associatedUsers = await this.userModel.findAll({ where: { roleId } });
        if (associatedUsers.length > 0) {
            throw new common_1.BadRequestException('Cannot delete role with associated users');
        }
        await this.rolePermissionModel.destroy({ where: { roleId } });
        const snapshot = { roleId: role.roleId, roleName: role.roleName };
        await role.destroy();
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.SYSTEM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.ROLE,
            action: 'DELETE_ROLE',
            entityId: snapshot.roleId,
            entityName: snapshot.roleName,
            description: `Role "${snapshot.roleName}" deleted`,
            oldValues: snapshot,
            req,
        })
            .catch(() => { });
        return { message: 'Role deleted' };
    }
    async updatePermissions(roleId, dto, actorId, req) {
        const role = await this.findOne(roleId);
        const validPermissions = await this.permissionModel.findAll({
            where: { permissionId: { [sequelize_2.Op.in]: dto.permissionIds } },
        });
        if (validPermissions.length !== dto.permissionIds.length) {
            throw new common_1.BadRequestException('Some permissions are invalid.');
        }
        await role.$set('permissions', validPermissions);
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.SYSTEM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.ROLE,
            action: 'UPDATE_ROLE_PERMISSIONS',
            entityId: roleId,
            entityName: role.roleName,
            description: `Permissions replaced for role "${role.roleName}"`,
            metadata: { roleId, permissionCount: validPermissions.length },
            req,
        })
            .catch(() => { });
        return this.findOne(roleId);
    }
    async assignPermissions(roleId, permissionIds, actorId, req) {
        const role = await this.findOne(roleId);
        const permissions = await this.permissionModel.findAll({
            where: { permissionId: { [sequelize_2.Op.in]: permissionIds } },
        });
        await Promise.all(permissions.map((permission) => this.rolePermissionModel.findOrCreate({
            where: { roleId, permissionId: permission.permissionId },
        })));
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.SYSTEM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.ROLE,
            action: 'ASSIGN_PERMISSION_TO_ROLE',
            entityId: roleId,
            entityName: role.roleName,
            description: `Permission(s) assigned to role "${role.roleName}"`,
            metadata: { roleId, roleName: role.roleName, permissionIds },
            req,
        })
            .catch(() => { });
        return this.findOne(roleId);
    }
    async removePermission(roleId, permissionId, actorId, req) {
        const role = await this.findOne(roleId);
        await this.rolePermissionModel.destroy({ where: { roleId, permissionId } });
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.SYSTEM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.ROLE,
            action: 'REMOVE_ROLE_PERMISSIONS',
            entityId: roleId,
            entityName: role.roleName,
            description: `Permission removed from role "${role.roleName}"`,
            metadata: { roleId, permissionId },
            req,
        })
            .catch(() => { });
        return this.findOne(roleId);
    }
    async assignRole(dto, actorId, req) {
        const user = await this.userModel.findByPk(dto.userId);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const roleData = await this.roleModel.findOne({
            where: { roleName: dto.role },
        });
        if (!roleData)
            throw new common_1.BadRequestException('Invalid role specified');
        if (dto.role === 'SUPER_ADMIN') {
            const existing = await this.userModel.findOne({
                where: { roles: { [sequelize_2.Op.substring]: 'SUPER_ADMIN' } },
            });
            if (existing) {
                throw new common_1.BadRequestException('A SuperAdmin already exists');
            }
        }
        const oldRoles = user.roles;
        const oldRoleId = user.roleId;
        const oldStatus = user.status;
        const currentRoles = user.roles || [];
        if (dto.role === 'USERS') {
            user.roles = ['USERS'];
            user.roleId = null;
            user.status = 'inactive';
        }
        else {
            if (!currentRoles.includes(dto.role))
                currentRoles.push(dto.role);
            user.roles = currentRoles;
            user.roleId = roleData.roleId;
            user.status = 'active';
        }
        await user.save();
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.AUTH,
            subContext: activity_log_entity_1.SUB_CONTEXTS.USER,
            action: 'ASSIGN_ROLE',
            entityId: user.userId,
            entityName: user.username || user.email,
            description: `Role ${dto.role} assigned to user`,
            oldValues: { roles: oldRoles, roleId: oldRoleId, status: oldStatus },
            newValues: { roles: user.roles, roleId: user.roleId, status: user.status },
            req,
        })
            .catch(() => { });
        return { success: true, user };
    }
    findRecent() {
        return this.roleModel.findAll({ order: [['createdAt', 'DESC']], limit: 5 });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(role_entity_1.Role)),
    __param(1, (0, sequelize_1.InjectModel)(permission_entity_1.Permission)),
    __param(2, (0, sequelize_1.InjectModel)(role_permission_entity_1.RolePermission)),
    __param(3, (0, sequelize_1.InjectModel)(user_entity_1.User)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, activity_log_service_1.ActivityLogService])
], RolesService);
//# sourceMappingURL=roles.service.js.map