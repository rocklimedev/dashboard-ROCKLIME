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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.PermissionApi = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const role_entity_1 = require("./role.entity");
const role_permission_entity_1 = require("./role-permission.entity");
var PermissionApi;
(function (PermissionApi) {
    PermissionApi["VIEW"] = "view";
    PermissionApi["DELETE"] = "delete";
    PermissionApi["WRITE"] = "write";
    PermissionApi["EDIT"] = "edit";
    PermissionApi["EXPORT"] = "export";
})(PermissionApi || (exports.PermissionApi = PermissionApi = {}));
let Permission = class Permission extends sequelize_typescript_1.Model {
};
exports.Permission = Permission;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        primaryKey: true,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
    }),
    __metadata("design:type", String)
], Permission.prototype, "permissionId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(PermissionApi)),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Permission.prototype, "api", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(255), allowNull: false }),
    __metadata("design:type", String)
], Permission.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(500), allowNull: false }),
    __metadata("design:type", String)
], Permission.prototype, "route", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(255), allowNull: false }),
    __metadata("design:type", String)
], Permission.prototype, "module", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => role_permission_entity_1.RolePermission, { as: 'rolepermission_links' }),
    __metadata("design:type", Array)
], Permission.prototype, "rolepermissionLinks", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsToMany)(() => role_entity_1.Role, () => role_permission_entity_1.RolePermission),
    __metadata("design:type", Array)
], Permission.prototype, "roles", void 0);
exports.Permission = Permission = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'permissions', timestamps: true })
], Permission);
//# sourceMappingURL=permission.entity.js.map