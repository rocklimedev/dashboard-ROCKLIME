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
exports.OrderItemSchema = exports.OrderItem = exports.OrderItemLine = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let OrderItemLine = class OrderItemLine {
};
exports.OrderItemLine = OrderItemLine;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OrderItemLine.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OrderItemLine.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], OrderItemLine.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], OrderItemLine.prototype, "productCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], OrderItemLine.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OrderItemLine.prototype, "dispatchedQuantity", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], OrderItemLine.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OrderItemLine.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['percent', 'fixed'], default: 'percent' }),
    __metadata("design:type", String)
], OrderItemLine.prototype, "discountType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OrderItemLine.prototype, "tax", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], OrderItemLine.prototype, "total", void 0);
exports.OrderItemLine = OrderItemLine = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], OrderItemLine);
const OrderItemLineSchema = mongoose_1.SchemaFactory.createForClass(OrderItemLine);
let OrderItem = class OrderItem extends mongoose_2.Document {
};
exports.OrderItem = OrderItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], OrderItem.prototype, "orderId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [OrderItemLineSchema], default: [] }),
    __metadata("design:type", Array)
], OrderItem.prototype, "items", void 0);
exports.OrderItem = OrderItem = __decorate([
    (0, mongoose_1.Schema)()
], OrderItem);
exports.OrderItemSchema = mongoose_1.SchemaFactory.createForClass(OrderItem);
//# sourceMappingURL=order-item.schema.js.map