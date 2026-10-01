"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorsModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const vendor_entity_1 = require("./entities/vendor.entity");
const product_entity_1 = require("../products/entities/product.entity");
const vendors_controller_1 = require("./vendors.controller");
const vendors_service_1 = require("./vendors.service");
let VendorsModule = class VendorsModule {
};
exports.VendorsModule = VendorsModule;
exports.VendorsModule = VendorsModule = __decorate([
    (0, common_1.Module)({
        imports: [sequelize_1.SequelizeModule.forFeature([vendor_entity_1.Vendor, product_entity_1.Product])],
        controllers: [vendors_controller_1.VendorsController],
        providers: [vendors_service_1.VendorsService],
        exports: [vendors_service_1.VendorsService],
    })
], VendorsModule);
//# sourceMappingURL=vendors.module.js.map