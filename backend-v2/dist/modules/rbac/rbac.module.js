"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("./entities/permission.entity");
const role_permission_entity_1 = require("./entities/role-permission.entity");
const user_entity_1 = require("../users/entities/user.entity");
const roles_controller_1 = require("./roles.controller");
const roles_service_1 = require("./roles.service");
const permissions_controller_1 = require("./permissions.controller");
const permissions_service_1 = require("./permissions.service");
let RbacModule = class RbacModule {
};
exports.RbacModule = RbacModule;
exports.RbacModule = RbacModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forFeature([role_entity_1.Role, permission_entity_1.Permission, role_permission_entity_1.RolePermission, user_entity_1.User]),
        ],
        controllers: [roles_controller_1.RolesController, permissions_controller_1.PermissionsController],
        providers: [roles_service_1.RolesService, permissions_service_1.PermissionsService],
        exports: [roles_service_1.RolesService, permissions_service_1.PermissionsService],
    })
], RbacModule);
//# sourceMappingURL=rbac.module.js.map