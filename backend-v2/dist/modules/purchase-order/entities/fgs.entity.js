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
exports.FieldGuidedSheet = exports.FGS_STATUSES = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const vendor_entity_1 = require("../../vendors/entities/vendor.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const purchase_order_entity_1 = require("./purchase-order.entity");
exports.FGS_STATUSES = ['draft', 'negotiating', 'approved', 'converted', 'cancelled'];
let FieldGuidedSheet = class FieldGuidedSheet extends sequelize_typescript_1.Model {
};
exports.FieldGuidedSheet = FieldGuidedSheet;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, primaryKey: true, defaultValue: sequelize_typescript_1.DataType.UUIDV4 }),
    __metadata("design:type", String)
], FieldGuidedSheet.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(20), unique: true, allowNull: false }),
    __metadata("design:type", String)
], FieldGuidedSheet.prototype, "fgsNumber", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => vendor_entity_1.Vendor),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], FieldGuidedSheet.prototype, "vendorId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], FieldGuidedSheet.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM(...exports.FGS_STATUSES), defaultValue: 'draft' }),
    __metadata("design:type", String)
], FieldGuidedSheet.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, defaultValue: sequelize_typescript_1.DataType.NOW }),
    __metadata("design:type", Date)
], FieldGuidedSheet.prototype, "orderDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, allowNull: true }),
    __metadata("design:type", Date)
], FieldGuidedSheet.prototype, "expectDeliveryDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(12, 2), defaultValue: 0.0 }),
    __metadata("design:type", Number)
], FieldGuidedSheet.prototype, "totalAmount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(24), allowNull: true, unique: true }),
    __metadata("design:type", String)
], FieldGuidedSheet.prototype, "mongoItemsId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => vendor_entity_1.Vendor, { foreignKey: 'vendorId', as: 'vendor' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], FieldGuidedSheet.prototype, "vendor", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User, { foreignKey: 'userId', as: 'createdBy' }),
    __metadata("design:type", user_entity_1.User)
], FieldGuidedSheet.prototype, "createdBy", void 0);
__decorate([
    (0, sequelize_typescript_1.HasOne)(() => purchase_order_entity_1.PurchaseOrder, { foreignKey: 'fgsId', as: 'purchaseOrder' }),
    __metadata("design:type", purchase_order_entity_1.PurchaseOrder)
], FieldGuidedSheet.prototype, "purchaseOrder", void 0);
exports.FieldGuidedSheet = FieldGuidedSheet = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'field_guided_sheets', timestamps: true })
], FieldGuidedSheet);
//# sourceMappingURL=fgs.entity.js.map