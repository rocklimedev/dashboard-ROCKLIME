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
exports.Order = exports.ORDER_STATUSES = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const customer_entity_1 = require("../../customers/entities/customer.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const address_entity_1 = require("../../address/entities/address.entity");
const quotation_entity_1 = require("../../quotations/entities/quotation.entity");
const order_dispatch_entity_1 = require("./order-dispatch.entity");
const order_credit_note_entity_1 = require("./order-credit-note.entity");
const order_activity_entity_1 = require("./order-activity.entity");
exports.ORDER_STATUSES = [
    'DRAFT',
    'PREPARING',
    'CHECKING',
    'INVOICE',
    'PARTIALLY_DISPATCHED',
    'DISPATCHED',
    'PARTIALLY_DELIVERED',
    'DELIVERED',
    'RETURNED',
    'ONHOLD',
    'CANCELED',
    'CLOSED',
];
let Order = class Order extends sequelize_typescript_1.Model {
};
exports.Order = Order;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, primaryKey: true, defaultValue: sequelize_typescript_1.DataType.UUIDV4 }),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(30), allowNull: false, unique: true }),
    __metadata("design:type", String)
], Order.prototype, "orderNo", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: true }),
    __metadata("design:type", Array)
], Order.prototype, "products", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...exports.ORDER_STATUSES),
        allowNull: false,
        defaultValue: 'DRAFT',
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM('high', 'medium', 'low'), allowNull: false, defaultValue: 'medium' }),
    __metadata("design:type", String)
], Order.prototype, "priority", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DATEONLY, allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "dueDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.JSON, allowNull: true }),
    __metadata("design:type", Array)
], Order.prototype, "followupDates", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "source", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => customer_entity_1.Customer),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], Order.prototype, "createdFor", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false }),
    __metadata("design:type", String)
], Order.prototype, "createdBy", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "assignedUserId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "assignedTeamId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "secondaryUserId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => quotation_entity_1.Quotation),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "quotationId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => address_entity_1.Address),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "shipTo", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(500), allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "gatePassLink", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(500), allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "invoiceLink", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(500), allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "receivingDocumentLink", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(30), allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "masterPipelineNo", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(30), allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "previousOrderNo", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "shipping", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(5, 2), allowNull: true }),
    __metadata("design:type", Number)
], Order.prototype, "gst", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "gstValue", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "extraDiscount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ENUM('percent', 'fixed'), allowNull: true }),
    __metadata("design:type", String)
], Order.prototype, "extraDiscountType", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "extraDiscountValue", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "finalAmount", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "amountPaid", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User, { foreignKey: 'secondaryUserId', as: 'secondaryUser' }),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "secondaryUser", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User, { foreignKey: 'createdBy', as: 'creator' }),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "creator", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User, { foreignKey: 'assignedUserId', as: 'assignedUser' }),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "assignedUser", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => customer_entity_1.Customer, { foreignKey: 'createdFor', as: 'customer' }),
    __metadata("design:type", customer_entity_1.Customer)
], Order.prototype, "customer", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => address_entity_1.Address, { foreignKey: 'shipTo', as: 'shippingAddress' }),
    __metadata("design:type", address_entity_1.Address)
], Order.prototype, "shippingAddress", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => quotation_entity_1.Quotation, { foreignKey: 'quotationId', as: 'quotation' }),
    __metadata("design:type", quotation_entity_1.Quotation)
], Order.prototype, "quotation", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => order_dispatch_entity_1.OrderDispatch, { foreignKey: 'orderId', as: 'dispatches' }),
    __metadata("design:type", Array)
], Order.prototype, "dispatches", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => order_credit_note_entity_1.OrderCreditNote, { foreignKey: 'orderId', as: 'creditNotes' }),
    __metadata("design:type", Array)
], Order.prototype, "creditNotes", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => order_activity_entity_1.OrderActivity, { foreignKey: 'orderId', as: 'activityLog' }),
    __metadata("design:type", Array)
], Order.prototype, "activityLog", void 0);
exports.Order = Order = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'orders',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['orderNo'] },
            { fields: ['status'] },
            { fields: ['createdFor'] },
            { fields: ['createdBy'] },
            { fields: ['assignedUserId'] },
            { fields: ['dueDate'] },
            { fields: ['quotationId'] },
            { fields: ['finalAmount'] },
            { fields: ['createdAt'] },
            { name: 'idx_order_status_date', fields: ['status', 'createdAt'] },
        ],
    })
], Order);
//# sourceMappingURL=order.entity.js.map