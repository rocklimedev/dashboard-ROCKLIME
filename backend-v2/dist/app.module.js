"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const configuration_1 = require("./config/configuration");
const database_module_1 = require("./database/database.module");
const mongo_module_1 = require("./database/mongo.module");
const upload_module_1 = require("./common/upload/upload.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const rbac_module_1 = require("./modules/rbac/rbac.module");
const address_module_1 = require("./modules/address/address.module");
const products_module_1 = require("./modules/products/products.module");
const cart_module_1 = require("./modules/cart/cart.module");
const customers_module_1 = require("./modules/customers/customers.module");
const quotations_module_1 = require("./modules/quotations/quotations.module");
const orders_module_1 = require("./modules/orders/orders.module");
const activity_log_module_1 = require("./modules/engagement/activity-log.module");
const vendors_module_1 = require("./modules/vendors/vendors.module");
const purchase_order_module_1 = require("./modules/purchase-order/purchase-order.module");
const health_controller_1 = require("./health.controller");
const notifications_gateway_1 = require("./modules/engagement/notifications.gateway");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            database_module_1.DatabaseModule,
            mongo_module_1.MongoDatabaseModule,
            upload_module_1.UploadModule,
            activity_log_module_1.ActivityLogModule,
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            rbac_module_1.RbacModule,
            address_module_1.AddressModule,
            products_module_1.ProductsModule,
            cart_module_1.CartModule,
            customers_module_1.CustomersModule,
            quotations_module_1.QuotationsModule,
            orders_module_1.OrdersModule,
            vendors_module_1.VendorsModule,
            purchase_order_module_1.PurchaseOrderModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [notifications_gateway_1.NotificationsGateway],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map