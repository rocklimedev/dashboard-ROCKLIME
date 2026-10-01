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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderActivityLoggerService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const order_activity_entity_1 = require("./entities/order-activity.entity");
let OrderActivityLoggerService = class OrderActivityLoggerService {
    constructor(orderActivityModel) {
        this.orderActivityModel = orderActivityModel;
        this.logger = new common_1.Logger('OrderActivity');
    }
    async logOrderActivity(input) {
        try {
            await this.orderActivityModel.create({
                orderId: input.orderId,
                orderNo: input.orderNo,
                action: input.action,
                description: input.description ?? null,
                oldValue: input.oldValue ?? null,
                newValue: input.newValue ?? null,
                performedBy: input.performedBy ?? null,
                metadata: input.metadata ?? null,
                ipAddress: input.ipAddress ?? null,
            });
        }
        catch (error) {
            this.logger.error('Order Activity Log Error:', error);
        }
    }
};
exports.OrderActivityLoggerService = OrderActivityLoggerService;
exports.OrderActivityLoggerService = OrderActivityLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(order_activity_entity_1.OrderActivity)),
    __metadata("design:paramtypes", [Object])
], OrderActivityLoggerService);
//# sourceMappingURL=order-activity-logger.service.js.map