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
exports.PoItemSchema = exports.PoItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const fgs_item_schema_1 = require("./fgs-item.schema");
const PoLineItemSchema = mongoose_1.SchemaFactory.createForClass(fgs_item_schema_1.PoLineItem);
let PoItem = class PoItem extends mongoose_2.Document {
};
exports.PoItem = PoItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], PoItem.prototype, "poId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], PoItem.prototype, "poNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PoItem.prototype, "vendorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [PoLineItemSchema], default: [] }),
    __metadata("design:type", Array)
], PoItem.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], PoItem.prototype, "calculatedTotal", void 0);
exports.PoItem = PoItem = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'po_items' })
], PoItem);
exports.PoItemSchema = mongoose_1.SchemaFactory.createForClass(PoItem);
//# sourceMappingURL=po-item.schema.js.map