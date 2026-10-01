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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
let HealthController = class HealthController {
    constructor(sequelize) {
        this.sequelize = sequelize;
    }
    basicHealth() {
        return { status: 'OK', uptime: process.uptime() };
    }
    async dbHealth(res) {
        try {
            await this.sequelize.authenticate();
            return res.status(common_1.HttpStatus.OK).json({
                status: 'OK',
                message: 'Server & MySQL are alive',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                env: process.env.NODE_ENV,
            });
        }
        catch (err) {
            return res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
                status: 'ERROR',
                message: 'MySQL connection failed',
                error: err.message,
            });
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "basicHealth", null);
__decorate([
    (0, common_1.Get)('api/health'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "dbHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, sequelize_1.InjectConnection)()),
    __metadata("design:paramtypes", [sequelize_typescript_1.Sequelize])
], HealthController);
//# sourceMappingURL=health.controller.js.map