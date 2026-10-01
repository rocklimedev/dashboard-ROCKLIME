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
exports.OrderCreditNoteItem = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const order_credit_note_entity_1 = require("./order-credit-note.entity");
const order_entity_1 = require("./order.entity");
const product_entity_1 = require("../../products/entities/product.entity");
let OrderCreditNoteItem = class OrderCreditNoteItem extends sequelize_typescript_1.Model {
};
exports.OrderCreditNoteItem = OrderCreditNoteItem;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, primaryKey: true, defaultValue: sequelize_typescript_1.DataType.UUIDV4 }),
    __metadata("design:type", String)
], OrderCreditNoteItem.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => order_credit_note_entity_1.OrderCreditNote),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], OrderCreditNoteItem.prototype, "creditNoteId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => order_entity_1.Order),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], OrderCreditNoteItem.prototype, "orderId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => product_entity_1.Product),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], OrderCreditNoteItem.prototype, "productId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: true }),
    __metadata("design:type", String)
], OrderCreditNoteItem.prototype, "productCode", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(500), allowNull: false }),
    __metadata("design:type", String)
], OrderCreditNoteItem.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false }),
    __metadata("design:type", Number)
], OrderCreditNoteItem.prototype, "quantity", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false }),
    __metadata("design:type", Number)
], OrderCreditNoteItem.prototype, "price", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], OrderCreditNoteItem.prototype, "discount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM('percent', 'fixed'),
        allowNull: false,
        defaultValue: 'percent',
    }),
    __metadata("design:type", String)
], OrderCreditNoteItem.prototype, "discountType", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], OrderCreditNoteItem.prototype, "tax", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false }),
    __metadata("design:type", Number)
], OrderCreditNoteItem.prototype, "total", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(255), allowNull: true }),
    __metadata("design:type", String)
], OrderCreditNoteItem.prototype, "reason", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => order_credit_note_entity_1.OrderCreditNote, { foreignKey: 'creditNoteId', as: 'creditNote' }),
    __metadata("design:type", order_credit_note_entity_1.OrderCreditNote)
], OrderCreditNoteItem.prototype, "creditNote", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => order_entity_1.Order, { foreignKey: 'orderId', as: 'order' }),
    __metadata("design:type", order_entity_1.Order)
], OrderCreditNoteItem.prototype, "order", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => product_entity_1.Product, { foreignKey: 'productId', as: 'product' }),
    __metadata("design:type", product_entity_1.Product)
], OrderCreditNoteItem.prototype, "product", void 0);
exports.OrderCreditNoteItem = OrderCreditNoteItem = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'order_credit_note_items',
        timestamps: true,
        indexes: [{ fields: ['creditNoteId'] }, { fields: ['orderId'] }, { fields: ['productId'] }],
    })
], OrderCreditNoteItem);
//# sourceMappingURL=order-credit-note-item.entity.js.map