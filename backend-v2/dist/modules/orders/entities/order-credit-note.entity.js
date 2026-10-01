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
exports.OrderCreditNote = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const order_entity_1 = require("./order.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const order_credit_note_item_entity_1 = require("./order-credit-note-item.entity");
let OrderCreditNote = class OrderCreditNote extends sequelize_typescript_1.Model {
};
exports.OrderCreditNote = OrderCreditNote;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, primaryKey: true, defaultValue: sequelize_typescript_1.DataType.UUIDV4 }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => order_entity_1.Order),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "orderId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(30), allowNull: false }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "orderNo", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: true }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "creditNoteNumber", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(500), allowNull: true }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "creditNoteLink", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATE, allowNull: false, defaultValue: sequelize_typescript_1.DataType.NOW }),
    __metadata("design:type", Date)
], OrderCreditNote.prototype, "creditNoteDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], OrderCreditNote.prototype, "totalQuantity", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], OrderCreditNote.prototype, "totalAmount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "reason", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "remarks", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM('DRAFT', 'ISSUED', 'RECEIVED', 'CANCELED'),
        allowNull: false,
        defaultValue: 'ISSUED',
    }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], OrderCreditNote.prototype, "createdBy", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => order_entity_1.Order, { foreignKey: 'orderId', as: 'order' }),
    __metadata("design:type", order_entity_1.Order)
], OrderCreditNote.prototype, "order", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User, { foreignKey: 'createdBy', as: 'creator' }),
    __metadata("design:type", user_entity_1.User)
], OrderCreditNote.prototype, "creator", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => order_credit_note_item_entity_1.OrderCreditNoteItem, { foreignKey: 'creditNoteId', as: 'items' }),
    __metadata("design:type", Array)
], OrderCreditNote.prototype, "items", void 0);
exports.OrderCreditNote = OrderCreditNote = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'order_credit_notes',
        timestamps: true,
        indexes: [
            { fields: ['orderId'] },
            { fields: ['orderNo'] },
            { fields: ['creditNoteNumber'] },
            { fields: ['status'] },
            { fields: ['creditNoteDate'] },
        ],
    })
], OrderCreditNote);
//# sourceMappingURL=order-credit-note.entity.js.map