"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../modules/users/entities/user.entity");
const role_entity_1 = require("../modules/rbac/entities/role.entity");
const permission_entity_1 = require("../modules/rbac/entities/permission.entity");
const role_permission_entity_1 = require("../modules/rbac/entities/role-permission.entity");
const address_entity_1 = require("../modules/address/entities/address.entity");
const product_entity_1 = require("../modules/products/entities/product.entity");
const product_meta_entity_1 = require("../modules/products/entities/product-meta.entity");
const inventory_history_entity_1 = require("../modules/products/entities/inventory-history.entity");
const keyword_entity_1 = require("../modules/products/entities/keyword.entity");
const product_keyword_entity_1 = require("../modules/products/entities/product-keyword.entity");
const customer_entity_1 = require("../modules/customers/entities/customer.entity");
const quotation_entity_1 = require("../modules/quotations/entities/quotation.entity");
const activity_log_entity_1 = require("../modules/engagement/entities/activity-log.entity");
const order_entity_1 = require("../modules/orders/entities/order.entity");
const order_activity_entity_1 = require("../modules/orders/entities/order-activity.entity");
const order_dispatch_entity_1 = require("../modules/orders/entities/order-dispatch.entity");
const order_credit_note_entity_1 = require("../modules/orders/entities/order-credit-note.entity");
const order_credit_note_item_entity_1 = require("../modules/orders/entities/order-credit-note-item.entity");
const vendor_entity_1 = require("../modules/vendors/entities/vendor.entity");
const fgs_entity_1 = require("../modules/purchase-order/entities/fgs.entity");
const purchase_order_entity_1 = require("../modules/purchase-order/entities/purchase-order.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('database.url');
                    const common = {
                        dialect: 'mysql',
                        logging: false,
                        autoLoadModels: true,
                        synchronize: false,
                        models: [
                            user_entity_1.User,
                            role_entity_1.Role,
                            permission_entity_1.Permission,
                            role_permission_entity_1.RolePermission,
                            address_entity_1.Address,
                            product_entity_1.Product,
                            product_meta_entity_1.ProductMeta,
                            inventory_history_entity_1.InventoryHistory,
                            keyword_entity_1.Keyword,
                            product_keyword_entity_1.ProductKeyword,
                            customer_entity_1.Customer,
                            quotation_entity_1.Quotation,
                            activity_log_entity_1.ActivityLog,
                            order_entity_1.Order,
                            order_activity_entity_1.OrderActivity,
                            order_dispatch_entity_1.OrderDispatch,
                            order_credit_note_entity_1.OrderCreditNote,
                            order_credit_note_item_entity_1.OrderCreditNoteItem,
                            vendor_entity_1.Vendor,
                            fgs_entity_1.FieldGuidedSheet,
                            purchase_order_entity_1.PurchaseOrder,
                        ],
                        pool: {
                            max: 5,
                            min: 1,
                            acquire: 20000,
                            idle: 30000,
                            evict: 10000,
                        },
                        dialectOptions: {
                            connectTimeout: 15000,
                        },
                    };
                    if (url) {
                        return { ...common, uri: url };
                    }
                    return {
                        ...common,
                        host: config.get('database.host'),
                        port: config.get('database.port'),
                        username: config.get('database.user'),
                        password: config.get('database.password'),
                        database: config.get('database.name'),
                    };
                },
            }),
        ],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map