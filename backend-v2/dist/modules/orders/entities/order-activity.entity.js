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
exports.OrderActivity = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const order_entity_1 = require("./order.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let OrderActivity = class OrderActivity extends sequelize_typescript_1.Model {
};
exports.OrderActivity = OrderActivity;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, primaryKey: true, defaultValue: sequelize_typescript_1.DataType.UUIDV4 }),
    __metadata("design:type", String)
], OrderActivity.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => order_entity_1.Order),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], OrderActivity.prototype, "orderId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(30), allowNull: false }),
    __metadata("design:type", String)
], OrderActivity.prototype, "orderNo", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(60), allowNull: false }),
    __metadata("design:type", String)
], OrderActivity.prototype, "action", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], OrderActivity.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: true }),
    __metadata("design:type", Object)
], OrderActivity.prototype, "oldValue", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: true }),
    __metadata("design:type", Object)
], OrderActivity.prototype, "newValue", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], OrderActivity.prototype, "performedBy", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: true }),
    __metadata("design:type", Object)
], OrderActivity.prototype, "metadata", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(64), allowNull: true }),
    __metadata("design:type", String)
], OrderActivity.prototype, "ipAddress", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => order_entity_1.Order, { foreignKey: 'orderId', as: 'order' }),
    __metadata("design:type", order_entity_1.Order)
], OrderActivity.prototype, "order", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User, { foreignKey: 'performedBy', as: 'performedByUser' }),
    __metadata("design:type", user_entity_1.User)
], OrderActivity.prototype, "performedByUser", void 0);
exports.OrderActivity = OrderActivity = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'order_activity',
        timestamps: true,
        updatedAt: false,
        indexes: [
            { fields: ['orderId'] },
            { fields: ['orderNo'] },
            { fields: ['action'] },
            { fields: ['createdAt'] },
        ],
    })
], OrderActivity);
//# sourceMappingURL=order-activity.entity.js.map