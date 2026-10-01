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
exports.QuotationVersionSchema = exports.QuotationVersion = exports.QuotationVersionItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let QuotationVersionItem = class QuotationVersionItem {
};
exports.QuotationVersionItem = QuotationVersionItem;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "productId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "productCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "companyCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationVersionItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationVersionItem.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationVersionItem.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'fixed' }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "discountType", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationVersionItem.prototype, "tax", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], QuotationVersionItem.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "isOptionFor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['variant', 'upgrade', 'addon', null], default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "optionType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "groupId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "floorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "floorName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "roomName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "areaId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "areaName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], QuotationVersionItem.prototype, "areaValue", void 0);
exports.QuotationVersionItem = QuotationVersionItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], QuotationVersionItem);
const QuotationVersionItemSchema = mongoose_1.SchemaFactory.createForClass(QuotationVersionItem);
let QuotationVersion = class QuotationVersion extends mongoose_2.Document {
};
exports.QuotationVersion = QuotationVersion;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], QuotationVersion.prototype, "quotationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], QuotationVersion.prototype, "version", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], QuotationVersion.prototype, "quotationData", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [QuotationVersionItemSchema], default: [] }),
    __metadata("design:type", Array)
], QuotationVersion.prototype, "quotationItems", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], QuotationVersion.prototype, "floors", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], QuotationVersion.prototype, "totalFloors", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], QuotationVersion.prototype, "updatedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now, index: true }),
    __metadata("design:type", Date)
], QuotationVersion.prototype, "updatedAt", void 0);
exports.QuotationVersion = QuotationVersion = __decorate([
    (0, mongoose_1.Schema)({ timestamps: false })
], QuotationVersion);
exports.QuotationVersionSchema = mongoose_1.SchemaFactory.createForClass(QuotationVersion);
exports.QuotationVersionSchema.index({ quotationId: 1, version: 1 }, { unique: true });
//# sourceMappingURL=quotation-version.schema.js.map