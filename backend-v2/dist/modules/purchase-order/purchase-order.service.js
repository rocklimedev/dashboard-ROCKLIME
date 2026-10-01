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
exports.PurchaseOrderService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const sequelize_typescript_1 = require("sequelize-typescript");
const purchase_order_entity_1 = require("./entities/purchase-order.entity");
const vendor_entity_1 = require("../vendors/entities/vendor.entity");
const user_entity_1 = require("../users/entities/user.entity");
const product_entity_1 = require("../products/entities/product.entity");
const po_item_schema_1 = require("./schemas/po-item.schema");
const po_shared_helpers_1 = require("./helpers/po-shared.helpers");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
let PurchaseOrderService = class PurchaseOrderService {
    constructor(poModel, vendorModel, productModel, poItemModel, sequelize, activityLog) {
        this.poModel = poModel;
        this.vendorModel = vendorModel;
        this.productModel = productModel;
        this.poItemModel = poItemModel;
        this.sequelize = sequelize;
        this.activityLog = activityLog;
    }
    async fetchPoItems(poId) {
        const doc = await this.poItemModel.findOne({ poId }).lean().exec();
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
            const poNumber = await (0, po_shared_helpers_1.generateDailyDocNumber)(this.poModel, 'poNumber', 'PO', t);
            const po = await this.poModel.create({
                poNumber,
                vendorId: dto.vendorId,
                userId: userId || null,
                fgsId: dto.fgsId || null,
                status: 'pending',
                orderDate: new Date(),
                expectDeliveryDate: dto.expectDeliveryDate ? new Date(dto.expectDeliveryDate) : null,
                totalAmount,
            }, { transaction: t });
            mongoDoc = await this.poItemModel.create({
                poId: po.id,
                poNumber: po.poNumber,
                vendorId: po.vendorId,
                items: preparedItems,
                calculatedTotal: totalAmount,
            });
            await po.update({ mongoItemsId: mongoDoc._id.toString() }, { transaction: t });
            await t.commit();
            this.activityLog
                .logActivity({
                userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
                subContext: activity_log_entity_1.SUB_CONTEXTS.PURCHASE_ORDER,
                action: 'CREATE_PURCHASE_ORDER',
                entityId: po.id,
                entityName: po.poNumber,
                description: `Purchase Order ${po.poNumber} created for ${vendor.vendorName}`,
                metadata: {
                    poNumber: po.poNumber,
                    vendorId: dto.vendorId,
                    vendorName: vendor.vendorName,
                    totalAmount,
                    itemCount: preparedItems.length,
                    source: dto.fgsId ? 'FGS' : 'DIRECT',
                    fgsId: dto.fgsId || null,
                },
            })
                .catch(() => { });
            return { message: 'Purchase Order created', purchaseOrder: { ...po.toJSON(), items: preparedItems } };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (mongoDoc?._id)
                await this.poItemModel.deleteOne({ _id: mongoDoc._id }).catch(() => { });
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to create Purchase Order');
        }
    }
    async createFromData(data, transaction) {
        const t = transaction || (await this.sequelize.transaction());
        const shouldCommit = !transaction;
        let mongoDoc = null;
        try {
            const { vendorId, items, expectDeliveryDate, fgsId, createdBy } = data;
            if (!vendorId || !Array.isArray(items) || items.length === 0) {
                throw new common_1.BadRequestException('vendorId and non-empty items array required');
            }
            const vendor = await this.vendorModel.findByPk(vendorId, { transaction: t });
            if (!vendor)
                throw new common_1.BadRequestException('Vendor not found');
            const { totalAmount, preparedItems } = await (0, po_shared_helpers_1.validateAndCalculateItems)(this.productModel, items, t);
            const poNumber = await (0, po_shared_helpers_1.generateDailyDocNumber)(this.poModel, 'poNumber', 'PO', t);
            const po = await this.poModel.create({
                poNumber,
                vendorId,
                userId: createdBy || null,
                fgsId: fgsId || null,
                status: 'pending',
                orderDate: new Date(),
                expectDeliveryDate: expectDeliveryDate ? new Date(expectDeliveryDate) : null,
                totalAmount,
            }, { transaction: t });
            mongoDoc = await this.poItemModel.create({
                poId: po.id,
                poNumber: po.poNumber,
                vendorId: po.vendorId,
                items: preparedItems,
                calculatedTotal: totalAmount,
            });
            await po.update({ mongoItemsId: mongoDoc._id.toString() }, { transaction: t });
            if (shouldCommit) {
                await t.commit();
                this.activityLog
                    .logActivity({
                    userId: createdBy ?? null,
                    contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
                    subContext: activity_log_entity_1.SUB_CONTEXTS.PURCHASE_ORDER,
                    action: 'CREATE_PO_FROM_SERVICE',
                    entityId: po.id,
                    entityName: po.poNumber,
                    description: `Purchase Order ${po.poNumber} created via service layer`,
                    metadata: {
                        poNumber: po.poNumber,
                        vendorId,
                        vendorName: vendor.vendorName,
                        totalAmount,
                        itemCount: preparedItems.length,
                        source: fgsId ? 'FGS' : 'DIRECT',
                        fgsId: fgsId || null,
                    },
                })
                    .catch(() => { });
            }
            return { purchaseOrder: { ...po.toJSON(), items: preparedItems }, poNumber: po.poNumber };
        }
        catch (error) {
            if (shouldCommit && t && !t.finished)
                await t.rollback().catch(() => { });
            if (mongoDoc?._id)
                await this.poItemModel.deleteOne({ _id: mongoDoc._id }).catch(() => { });
            throw error;
        }
    }
    async update(id, dto, userId) {
        const t = await this.sequelize.transaction();
        try {
            const po = await this.poModel.findByPk(id, { transaction: t });
            if (!po) {
                await t.rollback();
                throw new common_1.NotFoundException('Purchase order not found');
            }
            if (['delivered', 'cancelled'].includes(po.status)) {
                await t.rollback();
                throw new common_1.BadRequestException('Cannot modify delivered or cancelled Purchase Order');
            }
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
                if (!purchase_order_entity_1.PO_STATUSES.includes(dto.status)) {
                    await t.rollback();
                    throw new common_1.BadRequestException('Invalid status');
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
                await this.poItemModel.findOneAndUpdate({ poId: po.id }, {
                    vendorId: updateData.vendorId || po.vendorId,
                    items: preparedItems,
                    calculatedTotal: totalAmount,
                }, { upsert: true });
                returnedItems = preparedItems;
            }
            await po.update(updateData, { transaction: t });
            const updated = await this.poModel.findByPk(id, {
                include: [{ model: vendor_entity_1.Vendor, as: 'vendor', attributes: ['id', 'vendorName'] }],
                transaction: t,
            });
            await t.commit();
            this.activityLog
                .logActivity({
                userId: userId ?? po.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
                subContext: activity_log_entity_1.SUB_CONTEXTS.PURCHASE_ORDER,
                action: 'UPDATE_PURCHASE_ORDER',
                entityId: updated.id,
                entityName: po.poNumber,
                description: `Purchase Order ${po.poNumber} updated`,
                metadata: {
                    poNumber: po.poNumber,
                    changedFields: Object.keys(updateData),
                    status: updateData.status || updated.status,
                    totalAmount: updated.totalAmount,
                    vendorId: updateData.vendorId || po.vendorId,
                    itemsUpdated: !!dto.items,
                },
            })
                .catch(() => { });
            return {
                message: 'Purchase Order updated',
                purchaseOrder: { ...updated.toJSON(), items: returnedItems || (await this.fetchPoItems(id)) },
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
        const po = await this.poModel.findByPk(id, {
            include: [
                { model: vendor_entity_1.Vendor, as: 'vendor', attributes: ['id', 'vendorName'] },
                { model: user_entity_1.User, as: 'createdBy', attributes: ['userId', 'name', 'email', 'username'] },
            ],
        });
        if (!po)
            throw new common_1.NotFoundException('Purchase order not found');
        const items = await this.fetchPoItems(po.id);
        return { ...po.toJSON(), items };
    }
    async findAll(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(50, Math.max(5, parseInt(query.limit) || 20));
        const offset = (page - 1) * limit;
        const { count, rows } = await this.poModel.findAndCountAll({
            include: [
                { model: vendor_entity_1.Vendor, as: 'vendor', attributes: ['id', 'vendorName'] },
                { model: user_entity_1.User, as: 'createdBy', attributes: ['userId', 'name', 'email', 'username'] },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            subQuery: false,
        });
        const poIds = rows.map((r) => r.id);
        const mongoDocs = await this.poItemModel.find({ poId: { $in: poIds } }).lean();
        const itemsMap = new Map(mongoDocs.map((d) => [d.poId, d.items || []]));
        const data = rows.map((po) => ({ ...po.toJSON(), items: itemsMap.get(po.id) || [] }));
        return { data, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
    }
    async findByVendor(vendorId) {
        const orders = await this.poModel.findAll({
            where: { vendorId },
            include: [{ model: vendor_entity_1.Vendor, as: 'vendor', attributes: ['id', 'vendorName'] }],
            order: [['createdAt', 'DESC']],
        });
        const poIds = orders.map((po) => po.id);
        const itemDocs = await this.poItemModel.find({ poId: { $in: poIds } }).lean();
        const itemsMap = new Map(itemDocs.map((d) => [d.poId, d.items || []]));
        return orders.map((po) => ({ ...po.toJSON(), items: itemsMap.get(po.id) || [] }));
    }
    async remove(id, userId) {
        const t = await this.sequelize.transaction();
        try {
            const po = await this.poModel.findByPk(id, {
                include: [{ model: vendor_entity_1.Vendor, as: 'vendor' }],
                transaction: t,
            });
            if (!po) {
                await t.rollback();
                throw new common_1.NotFoundException('Not found');
            }
            await po.destroy({ transaction: t });
            await this.poItemModel.deleteOne({ poId: po.id });
            this.activityLog
                .logActivity({
                userId: userId ?? po.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
                subContext: activity_log_entity_1.SUB_CONTEXTS.PURCHASE_ORDER,
                action: 'DELETE_PURCHASE_ORDER',
                entityId: po.id,
                entityName: po.poNumber,
                description: `Purchase Order ${po.poNumber} deleted`,
                oldValues: {
                    poNumber: po.poNumber,
                    vendorId: po.vendorId,
                    vendorName: po.vendor?.vendorName || null,
                    totalAmount: po.totalAmount,
                    status: po.status,
                },
                metadata: { deletionType: 'HARD_DELETE', warning: 'PO permanently deleted' },
            })
                .catch(() => { });
            await t.commit();
            return { message: 'Purchase Order deleted successfully' };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Delete failed');
        }
    }
    async confirm(id, userId) {
        const t = await this.sequelize.transaction();
        try {
            const po = await this.poModel.findByPk(id, { transaction: t });
            if (!po)
                throw new common_1.NotFoundException('Purchase order not found');
            if (!['pending', 'confirmed'].includes(po.status)) {
                throw new common_1.BadRequestException('Can only confirm pending or confirmed orders');
            }
            const items = await this.fetchPoItems(po.id);
            if (items.length === 0)
                throw new common_1.BadRequestException('No items in PO');
            for (const item of items) {
                const product = await this.productModel.findByPk(item.productId, { transaction: t });
                if (product) {
                    product.quantity = Number(product.quantity || 0) + item.quantity;
                    await product.save({ transaction: t });
                }
            }
            const oldStatus = po.status;
            await po.update({ status: 'delivered' }, { transaction: t });
            const vendor = await this.vendorModel.findByPk(po.vendorId, { transaction: t });
            await t.commit();
            this.activityLog
                .logActivity({
                userId: userId ?? po.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
                subContext: activity_log_entity_1.SUB_CONTEXTS.PURCHASE_ORDER,
                action: 'CONFIRM_PURCHASE_ORDER',
                entityId: po.id,
                entityName: po.poNumber,
                description: `Purchase Order ${po.poNumber} confirmed and marked as delivered`,
                oldValues: { status: oldStatus },
                newValues: { status: 'delivered' },
                metadata: {
                    poNumber: po.poNumber,
                    vendorId: po.vendorId,
                    vendorName: vendor?.vendorName || null,
                    totalAmount: po.totalAmount,
                    itemCount: items.length,
                    stockUpdated: true,
                    stockImpact: items.map((i) => ({ productId: i.productId, quantityAdded: i.quantity })),
                },
            })
                .catch(() => { });
            return {
                message: 'Purchase Order confirmed and stock updated',
                purchaseOrder: { ...po.toJSON(), status: 'delivered' },
            };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Confirmation failed');
        }
    }
    async updateStatus(id, dto, userId) {
        const t = await this.sequelize.transaction();
        try {
            if (!purchase_order_entity_1.PO_STATUSES.includes(dto.status)) {
                throw new common_1.BadRequestException(`Invalid status. Allowed: ${purchase_order_entity_1.PO_STATUSES.join(', ')}`);
            }
            const po = await this.poModel.findByPk(id, { transaction: t });
            if (!po)
                throw new common_1.NotFoundException('Purchase order not found');
            if (po.status === dto.status)
                throw new common_1.BadRequestException('Status already set');
            if (dto.status === 'delivered' && po.status !== 'delivered') {
                const items = await this.fetchPoItems(po.id);
                for (const item of items) {
                    const product = await this.productModel.findByPk(item.productId, { transaction: t });
                    if (product) {
                        product.quantity = Number(product.quantity || 0) + item.quantity;
                        await product.save({ transaction: t });
                    }
                }
            }
            const oldStatus = po.status;
            await po.update({ status: dto.status }, { transaction: t });
            const vendor = await this.vendorModel.findByPk(po.vendorId, { transaction: t });
            await t.commit();
            this.activityLog
                .logActivity({
                userId: userId ?? po.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.PROCUREMENT,
                subContext: activity_log_entity_1.SUB_CONTEXTS.PURCHASE_ORDER,
                action: 'UPDATE_PO_STATUS',
                entityId: po.id,
                entityName: po.poNumber,
                description: `PO ${po.poNumber} status changed from ${oldStatus} to ${dto.status}`,
                oldValues: { status: oldStatus },
                newValues: { status: dto.status },
                metadata: {
                    poNumber: po.poNumber,
                    vendorId: po.vendorId,
                    vendorName: vendor?.vendorName || null,
                    stockUpdated: dto.status === 'delivered' && oldStatus !== 'delivered',
                },
            })
                .catch(() => { });
            return { message: `Status updated to ${dto.status}`, purchaseOrder: { ...po.toJSON(), status: dto.status } };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Status update failed');
        }
    }
};
exports.PurchaseOrderService = PurchaseOrderService;
exports.PurchaseOrderService = PurchaseOrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(purchase_order_entity_1.PurchaseOrder)),
    __param(1, (0, sequelize_1.InjectModel)(vendor_entity_1.Vendor)),
    __param(2, (0, sequelize_1.InjectModel)(product_entity_1.Product)),
    __param(3, (0, mongoose_1.InjectModel)(po_item_schema_1.PoItem.name)),
    __param(4, (0, sequelize_1.InjectConnection)()),
    __metadata("design:paramtypes", [Object, Object, Object, mongoose_2.Model,
        sequelize_typescript_1.Sequelize,
        activity_log_service_1.ActivityLogService])
], PurchaseOrderService);
//# sourceMappingURL=purchase-order.service.js.map