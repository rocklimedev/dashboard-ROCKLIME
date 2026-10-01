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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_service_1 = require("./roles.service");
const role_dto_1 = require("./dto/role.dto");
let RolesController = class RolesController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    create(dto, actorId, req) {
        return this.rolesService.create(dto, actorId, req);
    }
    findAll() {
        return this.rolesService.findAll();
    }
    findRecent() {
        return this.rolesService.findRecent();
    }
    findOne(roleId) {
        return this.rolesService.findOne(roleId);
    }
    updatePermissions(roleId, dto, actorId, req) {
        return this.rolesService.updatePermissions(roleId, dto, actorId, req);
    }
    remove(roleId, actorId, req) {
        return this.rolesService.remove(roleId, actorId, req);
    }
    assignPermissions(roleId, permissionIds, actorId, req) {
        return this.rolesService.assignPermissions(roleId, permissionIds, actorId, req);
    }
    removePermission(roleId, permissionId, actorId, req) {
        return this.rolesService.removePermission(roleId, permissionId, actorId, req);
    }
    assignRole(dto, actorId, req) {
        return this.rolesService.assignRole(dto, actorId, req);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermission)({ api: 'write', name: 'create_role', module: 'roles', route: '/roles' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.CreateRoleDto, String, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermission)({ api: 'view', name: 'get_all_roles', module: 'roles', route: '/roles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('recent'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findRecent", null);
__decorate([
    (0, common_1.Get)(':roleId'),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':roleId'),
    (0, permissions_decorator_1.RequirePermission)({
        api: 'edit',
        name: 'update_role_permissions',
        module: 'roles',
        route: '/roles/:roleId',
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, role_dto_1.UpdateRolePermissionsDto, String, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "updatePermissions", null);
__decorate([
    (0, common_1.Delete)(':roleId'),
    (0, permissions_decorator_1.RequirePermission)({
        api: 'delete',
        name: 'delete_role',
        module: 'roles',
        route: '/roles/:roleId',
    }),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':roleId/permissions'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Body)('permissionIds')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignPermissions", null);
__decorate([
    (0, common_1.Delete)(':roleId/permissions/:permissionId'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Param)('permissionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "removePermission", null);
__decorate([
    (0, common_1.Post)('assign-role'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.AssignRoleDto, String, Object]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignRole", null);
exports.RolesController = RolesController = __decorate([
    (0, common_1.Controller)('roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map