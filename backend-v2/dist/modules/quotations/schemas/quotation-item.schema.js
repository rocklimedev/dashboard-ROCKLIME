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
exports.QuotationItemSchema = exports.QuotationItem = exports.QuotationItemLine = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let QuotationItemLine = class QuotationItemLine {
};
exports.QuotationItemLine = QuotationItemLine;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "parentProductId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "productCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "companyCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationItemLine.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationItemLine.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationItemLine.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['percent', 'fixed'], default: 'percent' }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "discountType", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationItemLine.prototype, "tax", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationItemLine.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "isOptionFor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['variant', 'upgrade', 'addon', null], default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "optionType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "groupId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "floorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "floorName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "roomName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], QuotationItemLine.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "areaId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "areaName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationItemLine.prototype, "areaValue", void 0);
exports.QuotationItemLine = QuotationItemLine = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], QuotationItemLine);
const QuotationItemLineSchema = mongoose_1.SchemaFactory.createForClass(QuotationItemLine);
let QuotationItem = class QuotationItem extends mongoose_2.Document {
};
exports.QuotationItem = QuotationItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], QuotationItem.prototype, "quotationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [QuotationItemLineSchema], default: [] }),
    __metadata("design:type", Array)
], QuotationItem.prototype, "items", void 0);
exports.QuotationItem = QuotationItem = __decorate([
    (0, mongoose_1.Schema)()
], QuotationItem);
exports.QuotationItemSchema = mongoose_1.SchemaFactory.createForClass(QuotationItem);
//# sourceMappingURL=quotation-item.schema.js.map