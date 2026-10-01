"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const fgs_entity_1 = require("./entities/fgs.entity");
const purchase_order_entity_1 = require("./entities/purchase-order.entity");
const vendor_entity_1 = require("../vendors/entities/vendor.entity");
const product_entity_1 = require("../products/entities/product.entity");
const user_entity_1 = require("../users/entities/user.entity");
const fgs_item_schema_1 = require("./schemas/fgs-item.schema");
const po_item_schema_1 = require("./schemas/po-item.schema");
const fgs_controller_1 = require("./fgs.controller");
const fgs_service_1 = require("./fgs.service");
const purchase_order_controller_1 = require("./purchase-order.controller");
const purchase_order_service_1 = require("./purchase-order.service");
let PurchaseOrderModule = class PurchaseOrderModule {
};
exports.PurchaseOrderModule = PurchaseOrderModule;
exports.PurchaseOrderModule = PurchaseOrderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forFeature([fgs_entity_1.FieldGuidedSheet, purchase_order_entity_1.PurchaseOrder, vendor_entity_1.Vendor, product_entity_1.Product, user_entity_1.User]),
            mongoose_1.MongooseModule.forFeature([
                { name: fgs_item_schema_1.FgsItem.name, schema: fgs_item_schema_1.FgsItemSchema },
                { name: po_item_schema_1.PoItem.name, schema: po_item_schema_1.PoItemSchema },
            ]),
        ],
        controllers: [fgs_controller_1.FgsController, purchase_order_controller_1.PurchaseOrderController],
        providers: [fgs_service_1.FgsService, purchase_order_service_1.PurchaseOrderService],
        exports: [fgs_service_1.FgsService, purchase_order_service_1.PurchaseOrderService],
    })
], PurchaseOrderModule);
//# sourceMappingURL=purchase-order.module.js.map