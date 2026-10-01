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
exports.PurchaseOrder = exports.PO_STATUSES = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const vendor_entity_1 = require("../../vendors/entities/vendor.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const fgs_entity_1 = require("./fgs.entity");
exports.PO_STATUSES = [
    'pending',
    'in_negotiation',
    'confirmed',
    'partial_delivered',
    'delivered',
    'cancelled',
];
let PurchaseOrder = class PurchaseOrder extends sequelize_typescript_1.Model {
};
exports.PurchaseOrder = PurchaseOrder;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, primaryKey: true, defaultValue: sequelize_typescript_1.DataType.UUIDV4 }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(20), unique: true, allowNull: false }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "poNumber", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => vendor_entity_1.Vendor),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "vendorId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => fgs_entity_1.FieldGuidedSheet),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "fgsId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM(...exports.PO_STATUSES), defaultValue: 'pending' }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, defaultValue: sequelize_typescript_1.DataType.NOW }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "orderDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, allowNull: true }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "expectDeliveryDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(12, 2), defaultValue: 0.0 }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "totalAmount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(24), allowNull: true, unique: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "mongoItemsId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => vendor_entity_1.Vendor, { foreignKey: 'vendorId', as: 'vendor' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], PurchaseOrder.prototype, "vendor", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => fgs_entity_1.FieldGuidedSheet, { foreignKey: 'fgsId', as: 'fgs' }),
    __metadata("design:type", fgs_entity_1.FieldGuidedSheet)
], PurchaseOrder.prototype, "fgs", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User, { foreignKey: 'userId', as: 'createdBy' }),
    __metadata("design:type", user_entity_1.User)
], PurchaseOrder.prototype, "createdBy", void 0);
exports.PurchaseOrder = PurchaseOrder = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'purchase_orders', timestamps: true })
], PurchaseOrder);
//# sourceMappingURL=purchase-order.entity.js.map