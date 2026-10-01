"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const order_entity_1 = require("./entities/order.entity");
const order_activity_entity_1 = require("./entities/order-activity.entity");
const order_dispatch_entity_1 = require("./entities/order-dispatch.entity");
const order_credit_note_entity_1 = require("./entities/order-credit-note.entity");
const order_credit_note_item_entity_1 = require("./entities/order-credit-note-item.entity");
const product_entity_1 = require("../products/entities/product.entity");
const inventory_history_entity_1 = require("../products/entities/inventory-history.entity");
const user_entity_1 = require("../users/entities/user.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const order_item_schema_1 = require("./schemas/order-item.schema");
const comment_schema_1 = require("./schemas/comment.schema");
const orders_controller_1 = require("./orders.controller");
const orders_service_1 = require("./orders.service");
const order_activity_logger_service_1 = require("./order-activity-logger.service");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forFeature([
                order_entity_1.Order,
                order_activity_entity_1.OrderActivity,
                order_dispatch_entity_1.OrderDispatch,
                order_credit_note_entity_1.OrderCreditNote,
                order_credit_note_item_entity_1.OrderCreditNoteItem,
                product_entity_1.Product,
                inventory_history_entity_1.InventoryHistory,
                user_entity_1.User,
                customer_entity_1.Customer,
            ]),
            mongoose_1.MongooseModule.forFeature([
                { name: order_item_schema_1.OrderItem.name, schema: order_item_schema_1.OrderItemSchema },
                { name: comment_schema_1.Comment.name, schema: comment_schema_1.CommentSchema },
            ]),
        ],
        controllers: [orders_controller_1.OrdersController],
        providers: [orders_service_1.OrdersService, order_activity_logger_service_1.OrderActivityLoggerService],
        exports: [orders_service_1.OrdersService],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map