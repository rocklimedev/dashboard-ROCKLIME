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
exports.ActivityLog = exports.SUB_CONTEXTS = exports.CONTEXT_TAGS = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const uuid_1 = require("uuid");
exports.CONTEXT_TAGS = {
    AUTH: 'AUTH',
    CRM: 'CRM',
    CATALOG: 'CATALOG',
    SALES: 'SALES',
    PROCUREMENT: 'PROCUREMENT',
    INVENTORY: 'INVENTORY',
    SYSTEM: 'SYSTEM',
};
exports.SUB_CONTEXTS = {
    USER: 'USER',
    CUSTOMER: 'CUSTOMER',
    VENDOR: 'VENDOR',
    BRAND: 'BRAND',
    CATEGORY: 'CATEGORY',
    PRODUCT: 'PRODUCT',
    QUOTATION: 'QUOTATION',
    ORDER: 'ORDER',
    FIELD_GUIDED_SHEET: 'FIELD_GUIDED_SHEET',
    PURCHASE_ORDER: 'PURCHASE_ORDER',
    TEAM: 'TEAM',
    ADDRESS: 'ADDRESS',
    ROLE: 'ROLE',
};
let ActivityLog = class ActivityLog extends sequelize_typescript_1.Model {
};
exports.ActivityLog = ActivityLog;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        primaryKey: true,
        defaultValue: () => (0, uuid_1.v4)(),
    }),
    __metadata("design:type", String)
], ActivityLog.prototype, "activityLogId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], ActivityLog.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM(...Object.values(exports.CONTEXT_TAGS)), allowNull: false }),
    __metadata("design:type", String)
], ActivityLog.prototype, "contextTag", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM(...Object.values(exports.SUB_CONTEXTS)), allowNull: false }),
    __metadata("design:type", String)
], ActivityLog.prototype, "subContext", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: false }),
    __metadata("design:type", String)
], ActivityLog.prototype, "action", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], ActivityLog.prototype, "entityId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(255), allowNull: true }),
    __metadata("design:type", String)
], ActivityLog.prototype, "entityName", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], ActivityLog.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM('info', 'warning', 'error', 'critical'),
        allowNull: false,
        defaultValue: 'info',
    }),
    __metadata("design:type", String)
], ActivityLog.prototype, "severity", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "oldValues", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "newValues", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "metadata", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(50), allowNull: true }),
    __metadata("design:type", String)
], ActivityLog.prototype, "ipAddress", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], ActivityLog.prototype, "userAgent", void 0);
exports.ActivityLog = ActivityLog = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'activity_logs',
        timestamps: true,
        indexes: [
            { name: 'idx_activity_logs_user_id', fields: ['userId'] },
            { name: 'idx_activity_logs_context_tag', fields: ['contextTag'] },
            { name: 'idx_activity_logs_sub_context', fields: ['subContext'] },
            { name: 'idx_activity_logs_entity_id', fields: ['entityId'] },
            { name: 'idx_activity_logs_action', fields: ['action'] },
            { name: 'idx_activity_logs_severity', fields: ['severity'] },
            { name: 'idx_activity_logs_created_at', fields: ['createdAt'] },
            {
                name: 'idx_activity_logs_context_subcontext',
                fields: ['contextTag', 'subContext'],
            },
        ],
    })
], ActivityLog);
//# sourceMappingURL=activity-log.entity.js.map