"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const product_entity_1 = require("./entities/product.entity");
const product_meta_entity_1 = require("./entities/product-meta.entity");
const inventory_history_entity_1 = require("./entities/inventory-history.entity");
const keyword_entity_1 = require("./entities/keyword.entity");
const product_keyword_entity_1 = require("./entities/product-keyword.entity");
const user_entity_1 = require("../users/entities/user.entity");
const products_controller_1 = require("./products.controller");
const products_service_1 = require("./products.service");
const product_meta_controller_1 = require("./product-meta.controller");
const product_meta_service_1 = require("./product-meta.service");
let ProductsModule = class ProductsModule {
};
exports.ProductsModule = ProductsModule;
exports.ProductsModule = ProductsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forFeature([
                product_entity_1.Product,
                product_meta_entity_1.ProductMeta,
                inventory_history_entity_1.InventoryHistory,
                keyword_entity_1.Keyword,
                product_keyword_entity_1.ProductKeyword,
                user_entity_1.User,
            ]),
        ],
        controllers: [products_controller_1.ProductsController, product_meta_controller_1.ProductMetaController],
        providers: [products_service_1.ProductsService, product_meta_service_1.ProductMetaService],
        exports: [products_service_1.ProductsService],
    })
], ProductsModule);
//# sourceMappingURL=products.module.js.map