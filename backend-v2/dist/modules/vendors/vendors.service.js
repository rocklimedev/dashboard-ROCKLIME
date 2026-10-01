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
exports.VendorsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const vendor_entity_1 = require("./entities/vendor.entity");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
let VendorsService = class VendorsService {
    constructor(vendorModel, activityLog) {
        this.vendorModel = vendorModel;
        this.activityLog = activityLog;
    }
    async create(dto, userId) {
        const vendor = await this.vendorModel.create({
            vendorId: dto.vendorId?.trim() || null,
            vendorName: dto.vendorName,
            brandSlug: dto.brandSlug,
            brandId: dto.brandId,
        });
        this.activityLog
            .logActivity({
            userId: userId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
            subContext: activity_log_entity_1.SUB_CONTEXTS.VENDOR,
            action: 'CREATE_VENDOR',
            entityId: vendor.vendorId,
            entityName: vendor.vendorName,
            description: `Vendor "${vendor.vendorName}" created`,
            metadata: {
                vendorId: vendor.vendorId,
                vendorName: vendor.vendorName,
                brandId: vendor.brandId || null,
                brandSlug: vendor.brandSlug || null,
                createdVia: 'ADMIN_PANEL',
            },
        })
            .catch(() => { });
        return vendor;
    }
    findAll() {
        return this.vendorModel.findAll();
    }
    async findOne(id) {
        const vendor = await this.vendorModel.findByPk(id);
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        return vendor;
    }
    async update(id, dto, userId) {
        const vendor = await this.vendorModel.findByPk(id);
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const oldValues = {
            vendorId: vendor.vendorId,
            vendorName: vendor.vendorName,
            brandSlug: vendor.brandSlug,
            brandId: vendor.brandId,
        };
        await vendor.update({
            vendorId: dto.vendorId?.trim() || null,
            vendorName: dto.vendorName,
            brandSlug: dto.brandSlug,
            brandId: dto.brandId,
        });
        this.activityLog
            .logActivity({
            userId: userId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
            subContext: activity_log_entity_1.SUB_CONTEXTS.VENDOR,
            action: 'UPDATE_VENDOR',
            entityId: vendor.id,
            entityName: vendor.vendorName,
            description: `Vendor "${vendor.vendorName}" updated`,
            oldValues,
            newValues: {
                vendorId: vendor.vendorId,
                vendorName: vendor.vendorName,
                brandSlug: vendor.brandSlug,
                brandId: vendor.brandId,
            },
            metadata: { changedFields: Object.keys(dto), vendorId: vendor.id },
        })
            .catch(() => { });
        return { message: 'Vendor updated successfully.', vendor };
    }
    async remove(id, userId) {
        const vendor = await this.vendorModel.findByPk(id);
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        await vendor.destroy();
        this.activityLog
            .logActivity({
            userId: userId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
            subContext: activity_log_entity_1.SUB_CONTEXTS.VENDOR,
            action: 'DELETE_VENDOR',
            entityId: vendor.id,
            entityName: vendor.vendorName,
            description: `Vendor "${vendor.vendorName}" deleted`,
            oldValues: { vendorId: vendor.id, vendorName: vendor.vendorName },
            metadata: {
                deletionType: 'HARD_DELETE',
                warning: 'Vendor removed permanently from system',
            },
        })
            .catch(() => { });
        return { message: 'Vendor deleted successfully' };
    }
    async checkVendorId(vendorId) {
        if (!vendorId || vendorId.trim() === '')
            return { isUnique: true };
        const vendor = await this.vendorModel.findOne({ where: { vendorId } });
        return { isUnique: !vendor };
    }
};
exports.VendorsService = VendorsService;
exports.VendorsService = VendorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [Object, activity_log_service_1.ActivityLogService])
], VendorsService);
//# sourceMappingURL=vendors.service.js.map