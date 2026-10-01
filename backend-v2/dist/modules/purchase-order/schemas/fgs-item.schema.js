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
exports.FgsItemSchema = exports.FgsItem = exports.PoLineItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let PoLineItem = class PoLineItem {
};
exports.PoLineItem = PoLineItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PoLineItem.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PoLineItem.prototype, "productName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], PoLineItem.prototype, "productCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], PoLineItem.prototype, "companyCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", String)
], PoLineItem.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 1 }),
    __metadata("design:type", Number)
], PoLineItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], PoLineItem.prototype, "unitPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0 }),
    __metadata("design:type", Number)
], PoLineItem.prototype, "mrp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PoLineItem.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['percent', 'fixed'], default: 'percent' }),
    __metadata("design:type", String)
], PoLineItem.prototype, "discountType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], PoLineItem.prototype, "tax", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], PoLineItem.prototype, "total", void 0);
exports.PoLineItem = PoLineItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PoLineItem);
const PoLineItemSchema = mongoose_1.SchemaFactory.createForClass(PoLineItem);
let FgsItem = class FgsItem extends mongoose_2.Document {
};
exports.FgsItem = FgsItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], FgsItem.prototype, "fgsId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], FgsItem.prototype, "fgsNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FgsItem.prototype, "vendorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [PoLineItemSchema], default: [] }),
    __metadata("design:type", Array)
], FgsItem.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], FgsItem.prototype, "calculatedTotal", void 0);
exports.FgsItem = FgsItem = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'fgs_items' })
], FgsItem);
exports.FgsItemSchema = mongoose_1.SchemaFactory.createForClass(FgsItem);
//# sourceMappingURL=fgs-item.schema.js.map