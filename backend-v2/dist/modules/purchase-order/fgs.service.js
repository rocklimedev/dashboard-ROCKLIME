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
exports.FgsService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const sequelize_typescript_1 = require("sequelize-typescript");
const fgs_entity_1 = require("./entities/fgs.entity");
const vendor_entity_1 = require("../vendors/entities/vendor.entity");
const user_entity_1 = require("../users/entities/user.entity");
const product_entity_1 = require("../products/entities/product.entity");
const fgs_item_schema_1 = require("./schemas/fgs-item.schema");
const po_shared_helpers_1 = require("./helpers/po-shared.helpers");
const purchase_order_service_1 = require("./purchase-order.service");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
let FgsService = class FgsService {
    constructor(fgsModel, vendorModel, productModel, fgsItemModel, sequelize, purchaseOrderService, activityLog) {
        this.fgsModel = fgsModel;
        this.vendorModel = vendorModel;
        this.productModel = productModel;
        this.fgsItemModel = fgsItemModel;
        this.sequelize = sequelize;
        this.purchaseOrderService = purchaseOrderService;
        this.activityLog = activityLog;
    }
    async fetchFgsItems(fgsId) {
        const doc = await this.fgsItemModel.findOne({ fgsId }).lean().exec();
        return doc?.items || [];
    }
    async create(dto, userId) {
        const t = await this.sequelize.transaction();
        let mongoDoc = null;
        try {
            if (!dto.vendorId || !Array.isArray(dto.items) || dto.items.length === 0) {
                await t.rollback();
                throw new common_1.BadRequestException('vendorId and non-empty items array required');
            }
            const vendor = await this.vendorModel.findByPk(dto.vendorId, { transaction: t });
            if (!vendor) {
                await t.rollback();
                throw new common_1.BadRequestException('Vendor not found');
            }
            const { totalAmount, preparedItems } = await (0, po_shared_helpers_1.validateAndCalculateItems)(this.productModel, dto.items, t);
            const fgsNumber = await (0, po_shared_helpers_1.generateDailyDocNumber)(this.fgsModel, 'fgsNumber', 'FGS', t);
            const fgs = await this.fgsModel.create({
                fgsNumber,
                vendorId: dto.vendorId,
                userId: userId || null,
                status: 'draft',
                orderDate: new Date(),
                expectDeliveryDate: dto.expectDeliveryDate ? new Date(dto.expectDeliveryDate) : null,
                totalAmount,
            }, { transaction: t });
            mongoDoc = await this.fgsItemModel.create({
                fgsId: fgs.id,
                fgsNumber: fgs.fgsNumber,
                vendorId: fgs.vendorId,
                items: preparedItems,
                calculatedTotal: totalAmount,
            });
            await fgs.update({ mongoItemsId: mongoDoc._id.toString() }, { transaction: t });
            await t.commit();
            this.activityLog
                .logActivity({
                userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
                subContext: activity_log_entity_1.SUB_CONTEXTS.FIELD_GUIDED_SHEET,
                action: 'FGS_CREATED',
                entityId: fgs.id,
                entityName: fgs.fgsNumber,
                description: `Field Guided Sheet ${fgs.fgsNumber} created for ${vendor.vendorName}`,
                newValues: {
                    fgsId: fgs.id,
                    fgsNumber: fgs.fgsNumber,
                    vendorId: vendor.id,
                    vendorName: vendor.vendorName,
                    totalAmount,
                    status: fgs.status,
                    itemCount: preparedItems.length,
                },
                metadata: { mongoItemsId: mongoDoc?._id?.toString() },
            })
                .catch(() => { });
            return {
                message: 'Field Guided Sheet created',
                fieldGuidedSheet: { ...fgs.toJSON(), items: preparedItems },
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (mongoDoc?._id) {
                await this.fgsItemModel.deleteOne({ _id: mongoDoc._id }).catch(() => { });
            }
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to create Field Guided Sheet');
        }
    }
    async update(id, dto, userId) {
        const t = await this.sequelize.transaction();
        try {
            const fgs = await this.fgsModel.findByPk(id, { transaction: t });
            if (!fgs) {
                await t.rollback();
                throw new common_1.NotFoundException('Field guided sheet not found');
            }
            if (fgs.status === 'converted') {
                await t.rollback();
                throw new common_1.BadRequestException('Cannot modify converted Field Guided Sheet');
            }
            const oldSnapshot = fgs.toJSON();
            const updateData = {};
            if (dto.vendorId) {
                const v = await this.vendorModel.findByPk(dto.vendorId, { transaction: t });
                if (!v) {
                    await t.rollback();
                    throw new common_1.BadRequestException('Vendor not found');
                }
                updateData.vendorId = dto.vendorId;
            }
            if (dto.status) {
                if (!fgs_entity_1.FGS_STATUSES.includes(dto.status)) {
                    await t.rollback();
                    throw new common_1.BadRequestException('Invalid status');
                }
                if (dto.status === 'converted') {
                    await t.rollback();
                    throw new common_1.BadRequestException('Use /convert endpoint to convert to PO');
                }
                updateData.status = dto.status;
            }
            if (dto.expectDeliveryDate !== undefined) {
                updateData.expectDeliveryDate = dto.expectDeliveryDate
                    ? new Date(dto.expectDeliveryDate)
                    : null;
            }
            let returnedItems = null;
            if (Array.isArray(dto.items) && dto.items.length > 0) {
                const { totalAmount, preparedItems } = await (0, po_shared_helpers_1.validateAndCalculateItems)(this.productModel, dto.items, t);
                updateData.totalAmount = totalAmount;
                await this.fgsItemModel.findOneAndUpdate({ fgsId: fgs.id }, {
                    vendorId: updateData.vendorId || fgs.vendorId,
                    items: preparedItems,
                    calculatedTotal: totalAmount,
                }, { upsert: true, new: true });
                returnedItems = preparedItems;
            }
            await fgs.update(updateData, { transaction: t });
            const updated = await this.fgsModel.findByPk(id, {
                include: [{ model: vendor_entity_1.Vendor, as: 'vendor', attributes: ['id', 'vendorName'] }],
                transaction: t,
            });
            await t.commit();
            this.activityLog
                .logActivity({
                userId: userId ?? null,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
                subContext: activity_log_entity_1.SUB_CONTEXTS.FIELD_GUIDED_SHEET,
                action: 'UPDATE',
                entityId: updated.id,
                entityName: updated.fgsNumber,
                description: `FGS updated: ${updated.fgsNumber}`,
                oldValues: oldSnapshot,
                newValues: updated.toJSON(),
                metadata: { updatedFields: Object.keys(updateData), itemUpdated: !!returnedItems },
            })
                .catch(() => { });
            return {
                message: 'Field Guided Sheet updated',
                fieldGuidedSheet: {
                    ...updated.toJSON(),
                    items: returnedItems || (await this.fetchFgsItems(id)),
                },
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Update failed');
        }
    }
    async findOne(id) {
        const fgs = await this.fgsModel.findByPk(id, {
            include: [
                { model: vendor_entity_1.Vendor, as: 'vendor', attributes: ['id', 'vendorName'] },
                { model: user_entity_1.User, as: 'createdBy', attributes: ['userId', 'name', 'email', 'username'] },
            ],
        });
        if (!fgs)
            throw new common_1.NotFoundException('Field guided sheet not found');
        const items = await this.fetchFgsItems(fgs.id);
        return { ...fgs.toJSON(), items };
    }
    async findAll(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(50, Math.max(5, parseInt(query.limit) || 20));
        const offset = (page - 1) * limit;
        const { count, rows } = await this.fgsModel.findAndCountAll({
            include: [
                { model: vendor_entity_1.Vendor, as: 'vendor', attributes: ['id', 'vendorName'] },
                { model: user_entity_1.User, as: 'createdBy', attributes: ['userId', 'name', 'email', 'username'] },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            subQuery: false,
        });
        const fgsIds = rows.map((r) => r.id);
        const mongoDocs = await this.fgsItemModel.find({ fgsId: { $in: fgsIds } }).lean();
        const itemsMap = new Map(mongoDocs.map((d) => [d.fgsId, d.items || []]));
        const data = rows.map((fgs) => ({
            ...fgs.toJSON(),
            items: itemsMap.get(fgs.id) || [],
        }));
        return { data, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
    }
    async remove(id, userId) {
        const t = await this.sequelize.transaction();
        let snapshot;
        try {
            const fgs = await this.fgsModel.findByPk(id, {
                include: [{ model: vendor_entity_1.Vendor, as: 'vendor' }],
                transaction: t,
            });
            if (!fgs) {
                await t.rollback();
                throw new common_1.NotFoundException('Not found');
            }
            snapshot = {
                id: fgs.id,
                fgsNumber: fgs.fgsNumber,
                vendorId: fgs.vendorId,
                totalAmount: fgs.totalAmount,
            };
            await fgs.destroy({ transaction: t });
            await t.commit();
        }
        catch (error) {
            await t.rollback().catch(() => { });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Delete failed');
        }
        await this.fgsItemModel.deleteOne({ fgsId: snapshot.id }).catch(() => { });
        this.activityLog
            .logActivity({
            userId: userId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
            subContext: activity_log_entity_1.SUB_CONTEXTS.FIELD_GUIDED_SHEET,
            action: 'DELETE',
            entityId: snapshot.id,
            entityName: snapshot.fgsNumber,
            description: `FGS deleted: ${snapshot.fgsNumber}`,
            oldValues: snapshot,
            metadata: { vendorId: snapshot.vendorId, totalAmount: snapshot.totalAmount },
        })
            .catch(() => { });
        return { message: 'Field Guided Sheet deleted successfully' };
    }
    async convertToPo(id, userId) {
        const t = await this.sequelize.transaction();
        try {
            const fgs = await this.fgsModel.findByPk(id, {
                include: [{ model: vendor_entity_1.Vendor, as: 'vendor' }],
                transaction: t,
            });
            if (!fgs)
                throw new common_1.BadRequestException('Field guided sheet not found');
            if (fgs.status !== 'approved') {
                throw new common_1.BadRequestException('Only approved FGS can be converted to PO');
            }
            const items = await this.fetchFgsItems(fgs.id);
            if (items.length === 0)
                throw new common_1.BadRequestException('No items found in FGS');
            const poResult = await this.purchaseOrderService.createFromData({
                vendorId: fgs.vendorId,
                items: items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    mrp: i.mrp,
                    discount: i.discount,
                    discountType: i.discountType,
                    tax: i.tax,
                })),
                expectDeliveryDate: fgs.expectDeliveryDate,
                fgsId: fgs.id,
                createdBy: userId,
            }, t);
            if (!poResult?.purchaseOrder)
                throw new Error('Failed to create Purchase Order');
            await fgs.update({ status: 'converted' }, { transaction: t });
            await t.commit();
            return {
                message: 'Successfully converted to Purchase Order',
                purchaseOrder: poResult.purchaseOrder,
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Conversion failed');
        }
    }
    async updateStatus(id, dto, userId) {
        const t = await this.sequelize.transaction();
        let fgs = null;
        let oldStatus;
        let vendor = null;
        try {
            if (!fgs_entity_1.FGS_STATUSES.includes(dto.status)) {
                throw new common_1.BadRequestException(`Invalid status. Allowed: ${fgs_entity_1.FGS_STATUSES.join(', ')}`);
            }
            fgs = await this.fgsModel.findByPk(id, { transaction: t });
            if (!fgs)
                throw new common_1.NotFoundException('Not found');
            oldStatus = fgs.status;
            if (oldStatus === dto.status) {
                throw new common_1.BadRequestException('Status is already set to this value');
            }
            if (dto.status === 'converted') {
                throw new common_1.BadRequestException('Use /convert endpoint to convert to PO');
            }
            await fgs.update({ status: dto.status }, { transaction: t });
            vendor = await this.vendorModel.findByPk(fgs.vendorId, { transaction: t });
            await t.commit();
        }
        catch (error) {
            await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Status update failed');
        }
        this.activityLog
            .logActivity({
            userId: userId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
            subContext: activity_log_entity_1.SUB_CONTEXTS.FIELD_GUIDED_SHEET,
            action: 'STATUS_UPDATE',
            entityId: fgs.id,
            entityName: fgs.fgsNumber,
            description: `FGS status changed: ${oldStatus} -> ${fgs.status}`,
            oldValues: { status: oldStatus },
            newValues: { status: fgs.status },
            metadata: { vendorId: fgs.vendorId, vendorName: vendor?.vendorName || null },
        })
            .catch(() => { });
        return { message: `Status updated to ${fgs.status}`, fieldGuidedSheet: fgs.toJSON() };
    }
};
exports.FgsService = FgsService;
exports.FgsService = FgsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(fgs_entity_1.FieldGuidedSheet)),
    __param(1, (0, sequelize_1.InjectModel)(vendor_entity_1.Vendor)),
    __param(2, (0, sequelize_1.InjectModel)(product_entity_1.Product)),
    __param(3, (0, mongoose_1.InjectModel)(fgs_item_schema_1.FgsItem.name)),
    __param(4, (0, sequelize_1.InjectConnection)()),
    __metadata("design:paramtypes", [Object, Object, Object, mongoose_2.Model,
        sequelize_typescript_1.Sequelize,
        purchase_order_service_1.PurchaseOrderService,
        activity_log_service_1.ActivityLogService])
], FgsService);
//# sourceMappingURL=fgs.service.js.map