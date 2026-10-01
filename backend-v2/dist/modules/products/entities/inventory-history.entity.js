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
exports.InventoryHistory = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const uuid_1 = require("uuid");
const product_entity_1 = require("./product.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let InventoryHistory = class InventoryHistory extends sequelize_typescript_1.Model {
    static assignId(instance) {
        if (!instance.id)
            instance.id = (0, uuid_1.v7)();
    }
    static assignIds(instances) {
        instances.forEach((instance) => {
            if (!instance.id)
                instance.id = (0, uuid_1.v7)();
        });
    }
};
exports.InventoryHistory = InventoryHistory;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.CHAR(36), primaryKey: true, allowNull: false }),
    __metadata("design:type", String)
], InventoryHistory.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => product_entity_1.Product),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.CHAR(36), allowNull: false }),
    __metadata("design:type", String)
], InventoryHistory.prototype, "productId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: false }),
    __metadata("design:type", Number)
], InventoryHistory.prototype, "change", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: false }),
    __metadata("design:type", Number)
], InventoryHistory.prototype, "quantityAfter", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM('add-stock', 'remove-stock', 'sale', 'return', 'adjustment', 'correction'),
        allowNull: false,
    }),
    __metadata("design:type", String)
], InventoryHistory.prototype, "action", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(50), allowNull: true }),
    __metadata("design:type", String)
], InventoryHistory.prototype, "orderNo", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.CHAR(36), allowNull: true }),
    __metadata("design:type", String)
], InventoryHistory.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], InventoryHistory.prototype, "message", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => product_entity_1.Product, { foreignKey: 'productId', as: 'product' }),
    __metadata("design:type", product_entity_1.Product)
], InventoryHistory.prototype, "product", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User, { foreignKey: 'userId', as: 'user' }),
    __metadata("design:type", user_entity_1.User)
], InventoryHistory.prototype, "user", void 0);
__decorate([
    sequelize_typescript_1.BeforeValidate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [InventoryHistory]),
    __metadata("design:returntype", void 0)
], InventoryHistory, "assignId", null);
__decorate([
    sequelize_typescript_1.BeforeBulkCreate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], InventoryHistory, "assignIds", null);
exports.InventoryHistory = InventoryHistory = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'inventory_history',
        timestamps: true,
        indexes: [
            { name: 'idx_product_created', fields: ['productId', 'createdAt'] },
            { name: 'idx_created_at', fields: ['createdAt'] },
            { name: 'idx_action', fields: ['action'] },
            { name: 'idx_user', fields: ['userId'] },
            { name: 'idx_order_no', fields: ['orderNo'] },
        ],
    })
], InventoryHistory);
//# sourceMappingURL=inventory-history.entity.js.map