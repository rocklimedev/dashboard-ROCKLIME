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
exports.VersioningService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const quotation_entity_1 = require("../entities/quotation.entity");
const quotation_version_schema_1 = require("../schemas/quotation-version.schema");
const quotation_item_schema_1 = require("../schemas/quotation-item.schema");
let VersioningService = class VersioningService {
    constructor(quotationModel, quotationVersionModel, quotationItemModel) {
        this.quotationModel = quotationModel;
        this.quotationVersionModel = quotationVersionModel;
        this.quotationItemModel = quotationItemModel;
        this.logger = new common_1.Logger('QuotationVersioning');
    }
    async createVersionSnapshot(id, userId, transaction) {
        let newVersionNumber = 1;
        try {
            const latest = await this.quotationVersionModel
                .findOne({ quotationId: id })
                .sort({ version: -1 })
                .lean();
            if (latest)
                newVersionNumber = latest.version + 1;
            const currentMongoItems = await this.quotationItemModel.findOne({ quotationId: id }).lean();
            const rawQuotation = await this.quotationModel.findOne({
                where: { quotationId: id },
                attributes: [
                    'quotationId',
                    'reference_number',
                    'customerId',
                    'products',
                    'floors',
                    'totalFloors',
                    'extraDiscount',
                    'extraDiscountType',
                    'discountAmount',
                    'shippingAmount',
                    'gst',
                    'gstAmount',
                    'roundOff',
                    'finalAmount',
                    'followupDates',
                    'createdAt',
                    'updatedAt',
                ],
                raw: true,
                transaction,
            });
            const safeData = {
                ...rawQuotation,
                createdAt: rawQuotation?.createdAt ? new Date(rawQuotation.createdAt).toISOString() : null,
                updatedAt: rawQuotation?.updatedAt ? new Date(rawQuotation.updatedAt).toISOString() : null,
            };
            await this.quotationVersionModel.create({
                quotationId: id,
                version: newVersionNumber,
                quotationData: safeData,
                quotationItems: currentMongoItems?.items || [],
                floors: safeData.floors || [],
                totalFloors: safeData.totalFloors || 0,
                updatedBy: userId,
                updatedAt: new Date(),
            });
        }
        catch (err) {
            this.logger.error('Versioning failed:', err);
        }
        return newVersionNumber;
    }
};
exports.VersioningService = VersioningService;
exports.VersioningService = VersioningService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(quotation_entity_1.Quotation)),
    __param(1, (0, mongoose_1.InjectModel)(quotation_version_schema_1.QuotationVersion.name)),
    __param(2, (0, mongoose_1.InjectModel)(quotation_item_schema_1.QuotationItem.name)),
    __metadata("design:paramtypes", [Object, mongoose_2.Model,
        mongoose_2.Model])
], VersioningService);
//# sourceMappingURL=versioning.service.js.map