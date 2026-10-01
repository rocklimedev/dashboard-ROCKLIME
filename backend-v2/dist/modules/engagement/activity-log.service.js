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
exports.ActivityLogService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const activity_log_entity_1 = require("./entities/activity-log.entity");
let ActivityLogService = class ActivityLogService {
    constructor(activityLogModel) {
        this.activityLogModel = activityLogModel;
        this.logger = new common_1.Logger('ActivityLog');
    }
    async logActivity(input) {
        try {
            await this.activityLogModel.create({
                userId: input.userId ?? null,
                contextTag: input.contextTag,
                subContext: input.subContext,
                action: input.action,
                entityId: input.entityId ?? null,
                entityName: input.entityName ?? null,
                description: input.description ?? null,
                oldValues: input.oldValues ?? null,
                newValues: input.newValues ?? null,
                metadata: input.metadata ?? null,
                ipAddress: input.req?.ip ?? null,
                userAgent: input.req?.headers?.['user-agent'] ?? null,
            });
        }
        catch (error) {
            this.logger.error('Activity Log Error:', error);
        }
    }
};
exports.ActivityLogService = ActivityLogService;
exports.ActivityLogService = ActivityLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(activity_log_entity_1.ActivityLog)),
    __metadata("design:paramtypes", [Object])
], ActivityLogService);
//# sourceMappingURL=activity-log.service.js.map