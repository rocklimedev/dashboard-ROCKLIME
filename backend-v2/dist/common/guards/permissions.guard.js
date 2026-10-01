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
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const sequelize_1 = require("@nestjs/sequelize");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const user_entity_1 = require("../../modules/users/entities/user.entity");
const role_entity_1 = require("../../modules/rbac/entities/role.entity");
const permission_entity_1 = require("../../modules/rbac/entities/permission.entity");
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector, userModel) {
        this.reflector = reflector;
        this.userModel = userModel;
    }
    async canActivate(context) {
        const required = this.reflector.get(permissions_decorator_1.PERMISSION_KEY, context.getHandler());
        if (!required)
            return true;
        const request = context.switchToHttp().getRequest();
        const decoded = request.user;
        if (!decoded?.userId) {
            throw new common_1.UnauthorizedException('Unauthorized: Invalid token');
        }
        const user = await this.userModel.findByPk(decoded.userId, {
            include: [{ model: role_entity_1.Role, include: [{ model: permission_entity_1.Permission }] }],
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const role = user.role;
        if (role?.roleName?.toUpperCase() === 'SUPER_ADMIN')
            return true;
        const { api, name, module, route } = required;
        if (!api || !name || !module || !route) {
            throw new common_1.InternalServerErrorException('Invalid permission configuration in route');
        }
        const permissions = role?.permissions || [];
        const hasPermission = permissions.some((perm) => perm.api === api &&
            perm.name === name &&
            perm.module === module &&
            perm.route === route);
        if (!hasPermission) {
            throw new common_1.ForbiddenException(`Forbidden: Missing permission "${name}" (${api.toUpperCase()} - ${module})`);
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, sequelize_1.InjectModel)(user_entity_1.User)),
    __metadata("design:paramtypes", [core_1.Reflector, Object])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map