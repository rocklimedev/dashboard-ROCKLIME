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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_2 = require("sequelize");
const uuid_1 = require("uuid");
const quotation_entity_1 = require("./entities/quotation.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const user_entity_1 = require("../users/entities/user.entity");
const quotation_item_schema_1 = require("./schemas/quotation-item.schema");
const quotation_version_schema_1 = require("./schemas/quotation-version.schema");
const calculation_helpers_1 = require("./helpers/calculation.helpers");
const misc_helpers_1 = require("./helpers/misc.helpers");
const quotation_number_service_1 = require("./services/quotation-number.service");
const versioning_service_1 = require("./services/versioning.service");
const product_enrichment_service_1 = require("./services/product-enrichment.service");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
let QuotationsService = class QuotationsService {
    constructor(quotationModel, quotationItemModel, quotationVersionModel, sequelize, numberService, versioningService, enrichmentService, activityLog) {
        this.quotationModel = quotationModel;
        this.quotationItemModel = quotationItemModel;
        this.quotationVersionModel = quotationVersionModel;
        this.sequelize = sequelize;
        this.numberService = numberService;
        this.versioningService = versioningService;
        this.enrichmentService = enrichmentService;
        this.activityLog = activityLog;
    }
    async create(dto, user) {
        const t = await this.sequelize.transaction();
        try {
            let incomingProducts = dto.products;
            if (typeof incomingProducts === 'string') {
                try {
                    incomingProducts = JSON.parse(incomingProducts);
                }
                catch {
                    await t.rollback();
                    throw new common_1.BadRequestException('Invalid products JSON format');
                }
            }
            if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
                await t.rollback();
                throw new common_1.BadRequestException('At least one product is required');
            }
            if (!dto.customerId) {
                await t.rollback();
                throw new common_1.BadRequestException('Customer ID is required');
            }
            const dueDate = !dto.due_date || dto.due_date === 'null' ? null : dto.due_date;
            const extraDiscount = Number(dto.extraDiscount) || 0;
            const extraDiscountType = dto.extraDiscountType || 'percent';
            const shippingAmount = Number(dto.shippingAmount) || 0;
            const gst = Number(dto.gst) || 0;
            const incomingFloors = dto.floors || [];
            const productIds = [
                ...new Set(incomingProducts.map((p) => p.productId || p.id).filter(Boolean)),
            ];
            const productMap = await this.enrichmentService.fetchProductMap(productIds, t);
            const enrichedProducts = this.enrichmentService.enrichProductsForCreate(incomingProducts, productMap);
            const floors = Array.isArray(incomingFloors) && incomingFloors.length > 0
                ? incomingFloors
                : (0, misc_helpers_1.buildFloorsFromProducts)(enrichedProducts);
            const totals = (0, calculation_helpers_1.calculateTotals)(enrichedProducts, extraDiscount, extraDiscountType, shippingAmount, gst);
            const reference_number = await this.numberService.generateQuotationNumber(t);
            const quotation = await this.quotationModel.create({
                customerId: dto.customerId,
                reference_number,
                document_title: dto.document_title || 'Quotation',
                quotation_date: dto.quotation_date || new Date().toISOString().split('T')[0],
                due_date: dueDate,
                products: enrichedProducts,
                floors,
                optionalTotal: totals.optionalTotal,
                optionalItemsCount: totals.optionalItemsCount,
                totalFloors: floors.length,
                extraDiscount,
                extraDiscountType,
                discountAmount: totals.extraDiscountAmount,
                shippingAmount,
                gst,
                gstAmount: totals.gstAmount,
                roundOff: totals.roundOff,
                finalAmount: totals.finalAmount,
                shipTo: dto.shipTo || null,
                signature_name: dto.signature_name || '',
                signature_image: dto.signature_image || '',
                createdBy: user?.userId,
            }, { transaction: t });
            await this.quotationItemModel.create({
                quotationId: quotation.quotationId,
                items: enrichedProducts,
            });
            await t.commit();
            this.activityLog
                .logActivity({
                userId: user?.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.SALES,
                subContext: activity_log_entity_1.SUB_CONTEXTS.QUOTATION,
                action: 'CREATE_QUOTATION',
                entityId: quotation.quotationId,
                entityName: quotation.reference_number,
                description: `Quotation ${quotation.reference_number} created for customer ${dto.customerId}`,
                metadata: {
                    referenceNumber: quotation.reference_number,
                    customerId: dto.customerId,
                    productCount: enrichedProducts.length,
                    floorCount: floors.length,
                    financials: {
                        totalAmount: totals.finalAmount,
                        gst,
                        gstAmount: totals.gstAmount,
                        discount: extraDiscount,
                        discountType: extraDiscountType,
                        shipping: shippingAmount,
                    },
                },
            })
                .catch(() => { });
            return {
                message: 'Quotation created successfully',
                quotation: { ...quotation.toJSON(), finalAmount: totals.finalAmount },
                calculated: totals,
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to create quotation');
        }
    }
    async update(id, dto, user) {
        const t = await this.sequelize.transaction();
        try {
            const currentQuotation = await this.quotationModel.findOne({
                where: { quotationId: id },
                transaction: t,
            });
            if (!currentQuotation) {
                await t.rollback();
                throw new common_1.NotFoundException('Quotation not found');
            }
            const newVersionNumber = await this.versioningService.createVersionSnapshot(id, user?.userId, t);
            let incomingProducts = dto.products;
            if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
                await t.rollback();
                throw new common_1.BadRequestException('At least one product is required');
            }
            const extraDiscount = Number(dto.extraDiscount) || 0;
            const extraDiscountType = dto.extraDiscountType || 'percent';
            const shippingAmount = Number(dto.shippingAmount) || 0;
            const gst = Number(dto.gst) || 0;
            const followupDates = dto.followupDates || [];
            const productIds = [
                ...new Set(incomingProducts.map((p) => p.productId || p.id).filter(Boolean)),
            ];
            const productMap = await this.enrichmentService.fetchProductMapForUpdate(productIds, t);
            const enrichedProducts = this.enrichmentService.enrichProductsForUpdate(incomingProducts, productMap);
            const floors = Array.isArray(dto.floors) && dto.floors.length > 0
                ? dto.floors
                : (0, misc_helpers_1.buildFloorsFromProducts)(enrichedProducts);
            const totals = (0, calculation_helpers_1.calculateTotals)(enrichedProducts, extraDiscount, extraDiscountType, shippingAmount, gst);
            const { products: _p, floors: _f, ...rest } = dto;
            await this.quotationModel.update({
                ...rest,
                products: enrichedProducts,
                floors,
                totalFloors: floors.length,
                extraDiscount,
                extraDiscountType,
                discountAmount: totals.extraDiscountAmount,
                shippingAmount,
                gst,
                gstAmount: totals.gstAmount,
                roundOff: totals.roundOff,
                finalAmount: totals.finalAmount,
                followupDates: followupDates.length > 0 ? followupDates : null,
            }, { where: { quotationId: id }, transaction: t });
            try {
                if (enrichedProducts.length > 0) {
                    await this.quotationItemModel.updateOne({ quotationId: id }, { $set: { items: enrichedProducts } }, { upsert: true });
                }
                else {
                    await this.quotationItemModel.deleteOne({ quotationId: id });
                }
            }
            catch (mongoErr) {
                console.error('MongoDB sync failed:', mongoErr);
            }
            await t.commit();
            this.activityLog
                .logActivity({
                userId: user?.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.SALES,
                subContext: activity_log_entity_1.SUB_CONTEXTS.QUOTATION,
                action: 'UPDATE_QUOTATION',
                entityId: currentQuotation.quotationId,
                entityName: currentQuotation.reference_number || id,
                description: `Quotation ${id} updated (version ${newVersionNumber})`,
                oldValues: {
                    finalAmount: currentQuotation.finalAmount,
                    extraDiscount: currentQuotation.extraDiscount,
                    gst: currentQuotation.gst,
                    shippingAmount: currentQuotation.shippingAmount,
                },
                newValues: { finalAmount: totals.finalAmount, extraDiscount, gst, shippingAmount },
                metadata: {
                    quotationId: id,
                    version: newVersionNumber,
                    productCount: enrichedProducts.length,
                    floorCount: floors.length,
                },
            })
                .catch(() => { });
            return {
                message: 'Quotation updated successfully',
                version: newVersionNumber,
                finalAmount: totals.finalAmount,
                calculated: totals,
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to update quotation');
        }
    }
    async clone(id, user) {
        const t = await this.sequelize.transaction();
        try {
            const original = await this.quotationModel.findByPk(id, { transaction: t });
            if (!original) {
                await t.rollback();
                throw new common_1.NotFoundException('Quotation not found');
            }
            const originalItemsDoc = await this.quotationItemModel.findOne({ quotationId: id });
            let originalProducts = originalItemsDoc?.items || original.products || [];
            if (!Array.isArray(originalProducts) || originalProducts.length === 0) {
                await t.rollback();
                throw new common_1.BadRequestException('No products found in original quotation');
            }
            if (typeof originalProducts === 'string') {
                try {
                    originalProducts = JSON.parse(originalProducts);
                }
                catch {
                    await t.rollback();
                    throw new common_1.BadRequestException('Invalid products data in original quotation');
                }
            }
            const productIds = [
                ...new Set(originalProducts.map((p) => p.productId || p.id).filter(Boolean)),
            ];
            const productMap = await this.enrichmentService.fetchProductMap(productIds, t);
            const enrichedProducts = this.enrichmentService.enrichProductsForClone(originalProducts, productMap);
            const floors = Array.isArray(original.floors) && original.floors.length > 0
                ? original.floors
                : (0, misc_helpers_1.buildFloorsFromProducts)(enrichedProducts);
            const totals = (0, calculation_helpers_1.calculateTotals)(enrichedProducts, Number(original.extraDiscount) || 0, original.extraDiscountType || 'percent', Number(original.shippingAmount) || 0, Number(original.gst) || 0);
            const reference_number = await this.numberService.generateQuotationNumber(t);
            const newId = (0, uuid_1.v4)();
            const cloned = await this.quotationModel.create({
                quotationId: newId,
                document_title: `${original.document_title} (Duplicate)`,
                quotation_date: new Date().toISOString().split('T')[0],
                due_date: original.due_date,
                reference_number,
                customerId: original.customerId,
                createdBy: user?.userId,
                shipTo: original.shipTo,
                products: enrichedProducts,
                floors,
                totalFloors: floors.length,
                extraDiscount: Number(original.extraDiscount) || 0,
                extraDiscountType: original.extraDiscountType || 'percent',
                discountAmount: totals.extraDiscountAmount,
                shippingAmount: Number(original.shippingAmount) || 0,
                gst: Number(original.gst) || 0,
                gstAmount: totals.gstAmount,
                roundOff: totals.roundOff,
                finalAmount: totals.finalAmount,
                signature_name: original.signature_name || '',
                signature_image: original.signature_image || '',
                followupDates: original.followupDates || null,
            }, { transaction: t });
            await this.quotationItemModel.create({ quotationId: newId, items: enrichedProducts });
            await t.commit();
            this.activityLog
                .logActivity({
                userId: user?.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.SALES,
                subContext: activity_log_entity_1.SUB_CONTEXTS.QUOTATION,
                action: 'CLONE_QUOTATION',
                entityId: cloned.quotationId,
                entityName: reference_number,
                description: `Quotation cloned from ${original.reference_number}`,
                metadata: {
                    originalQuotationId: id,
                    originalReferenceNumber: original.reference_number,
                    newQuotationId: cloned.quotationId,
                    newReferenceNumber: reference_number,
                    customerId: original.customerId,
                    finalAmount: totals.finalAmount,
                    productCount: enrichedProducts.length,
                },
            })
                .catch(() => { });
            return {
                message: 'Quotation cloned successfully',
                clonedQuotation: { ...cloned.toJSON(), finalAmount: totals.finalAmount },
                calculated: totals,
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to clone quotation');
        }
    }
    async restoreVersion(id, version) {
        const t = await this.sequelize.transaction();
        try {
            const versionData = await this.quotationVersionModel.findOne({
                quotationId: id,
                version: Number(version),
            });
            if (!versionData) {
                await t.rollback();
                throw new common_1.NotFoundException('Version not found');
            }
            await this.quotationModel.update({
                ...versionData.quotationData,
                floors: versionData.floors || [],
                totalFloors: versionData.totalFloors || 0,
            }, { where: { quotationId: id }, transaction: t });
            if (versionData.quotationItems?.length > 0) {
                await this.quotationItemModel.updateOne({ quotationId: id }, { $set: { items: versionData.quotationItems } }, { upsert: true });
            }
            else {
                await this.quotationItemModel.deleteOne({ quotationId: id });
            }
            await t.commit();
            return { message: `Quotation restored to version ${version}` };
        }
        catch (error) {
            await t.rollback().catch(() => { });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to restore quotation');
        }
    }
    async findOne(id) {
        const quotation = await this.quotationModel.findByPk(id);
        if (!quotation)
            throw new common_1.NotFoundException('Quotation not found');
        const mongoDoc = await this.quotationItemModel.findOne({ quotationId: id });
        const items = mongoDoc?.items || [];
        const grouped = {};
        items.forEach((item) => {
            const gid = item.groupId || 'ungrouped';
            if (!grouped[gid])
                grouped[gid] = { main: null, options: [] };
            if (!item.isOptionFor)
                grouped[gid].main = item;
            else
                grouped[gid].options.push(item);
        });
        const calculated = (0, calculation_helpers_1.calculateTotals)(items, quotation.extraDiscount, quotation.extraDiscountType, quotation.shippingAmount, quotation.gst);
        return {
            ...quotation.toJSON(),
            items,
            groupedItems: Object.values(grouped),
            calculated,
        };
    }
    async findAll(query) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 500;
        const offset = (page - 1) * limit;
        const where = {};
        const search = query.search?.trim();
        if (search) {
            const searchTerm = `%${search}%`;
            where[sequelize_2.Op.or] = [
                { document_title: { [sequelize_2.Op.like]: searchTerm } },
                { reference_number: { [sequelize_2.Op.like]: searchTerm } },
            ];
        }
        if (query.customerId)
            where.customerId = query.customerId;
        if (query.status)
            where.status = query.status;
        if (query.startDate || query.endDate) {
            where.quotation_date = {};
            if (query.startDate)
                where.quotation_date[sequelize_2.Op.gte] = query.startDate;
            if (query.endDate)
                where.quotation_date[sequelize_2.Op.lte] = query.endDate;
        }
        const { count: totalQuotations, rows: quotations } = await this.quotationModel.findAndCountAll({
            where,
            offset,
            limit,
            order: [['quotation_date', 'DESC']],
            subQuery: false,
            include: [
                {
                    model: customer_entity_1.Customer,
                    as: 'customer',
                    attributes: ['customerId', 'name', 'companyName', 'mobileNumber'],
                    required: false,
                },
                {
                    model: user_entity_1.User,
                    as: 'creator',
                    attributes: ['userId', 'name', 'username'],
                    required: false,
                },
            ],
        });
        if (quotations.length === 0) {
            return { data: [], pagination: { total: totalQuotations, page, limit, totalPages: 0 } };
        }
        const quotationIds = quotations.map((q) => q.quotationId);
        const mongoItems = await this.quotationItemModel
            .find({ quotationId: { $in: quotationIds } })
            .lean();
        const itemsMap = {};
        mongoItems.forEach((doc) => {
            itemsMap[doc.quotationId] = doc.items || [];
        });
        const data = quotations.map((q) => {
            const plain = q.toJSON();
            return {
                ...plain,
                items: itemsMap[plain.quotationId] || [],
                customerName: plain.customer?.name || plain.customer?.companyName || 'Walk-in Customer',
                createdByName: plain.creator?.name || 'Unknown',
            };
        });
        return {
            data,
            pagination: {
                total: totalQuotations,
                page,
                limit,
                totalPages: Math.ceil(totalQuotations / limit),
            },
        };
    }
    async remove(id, user) {
        const quotation = await this.quotationModel.findByPk(id);
        if (!quotation)
            throw new common_1.NotFoundException('Quotation not found');
        const roles = user.roles || [];
        if (!roles.includes('ADMIN') &&
            !roles.includes('SUPER_ADMIN') &&
            user.userId !== quotation.createdBy) {
            throw new common_1.ForbiddenException('Unauthorized: Only admins, super admins, or the creator can delete this quotation');
        }
        await this.quotationModel.destroy({ where: { quotationId: id } });
        await this.quotationItemModel.deleteOne({ quotationId: id });
        this.activityLog
            .logActivity({
            userId: user?.userId,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.SALES,
            subContext: activity_log_entity_1.SUB_CONTEXTS.QUOTATION,
            action: 'DELETE_QUOTATION',
            entityId: quotation.quotationId,
            entityName: quotation.reference_number || quotation.quotationId,
            description: `Quotation ${quotation.reference_number || quotation.quotationId} deleted`,
            oldValues: {
                quotationId: quotation.quotationId,
                referenceNumber: quotation.reference_number,
                createdBy: quotation.createdBy,
                customerId: quotation.customerId,
            },
        })
            .catch(() => { });
        return { message: 'Quotation deleted successfully' };
    }
    async getVersions(id) {
        const versions = await this.quotationVersionModel
            .find({ quotationId: id })
            .sort({ version: -1 })
            .lean();
        if (!versions || versions.length === 0) {
            throw new common_1.NotFoundException('No versions found');
        }
        return versions.map((v) => ({
            version: v.version,
            updatedBy: v.updatedBy || 'Unknown',
            updatedAt: v.updatedAt,
            finalAmount: v.quotationData?.finalAmount || 0,
            document_title: v.quotationData?.document_title || 'Untitled Quotation',
            customerId: v.quotationData?.customerId,
            quotation_date: v.quotationData?.quotation_date,
            itemCount: (v.quotationItems || []).length,
            quotationData: v.quotationData,
            quotationItems: v.quotationItems || [],
        }));
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(quotation_entity_1.Quotation)),
    __param(1, (0, mongoose_1.InjectModel)(quotation_item_schema_1.QuotationItem.name)),
    __param(2, (0, mongoose_1.InjectModel)(quotation_version_schema_1.QuotationVersion.name)),
    __param(3, (0, sequelize_1.InjectConnection)()),
    __metadata("design:paramtypes", [Object, mongoose_2.Model,
        mongoose_2.Model,
        sequelize_typescript_1.Sequelize,
        quotation_number_service_1.QuotationNumberService,
        versioning_service_1.VersioningService,
        product_enrichment_service_1.ProductEnrichmentService,
        activity_log_service_1.ActivityLogService])
], QuotationsService);
//# sourceMappingURL=quotations.service.js.map