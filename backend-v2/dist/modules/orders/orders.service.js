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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const sequelize_typescript_1 = require("sequelize-typescript");
const sequelize_2 = require("sequelize");
const moment = require("moment");
const uuid_1 = require("uuid");
const sanitizeHtml = require("sanitize-html");
const order_entity_1 = require("./entities/order.entity");
const order_dispatch_entity_1 = require("./entities/order-dispatch.entity");
const order_credit_note_entity_1 = require("./entities/order-credit-note.entity");
const product_entity_1 = require("../products/entities/product.entity");
const inventory_history_entity_1 = require("../products/entities/inventory-history.entity");
const user_entity_1 = require("../users/entities/user.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const order_item_schema_1 = require("./schemas/order-item.schema");
const comment_schema_1 = require("./schemas/comment.schema");
const order_activity_logger_service_1 = require("./order-activity-logger.service");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
let OrdersService = class OrdersService {
    constructor(orderModel, productModel, inventoryHistoryModel, userModel, orderItemModel, commentModel, sequelize, orderActivityLogger, activityLog) {
        this.orderModel = orderModel;
        this.productModel = productModel;
        this.inventoryHistoryModel = inventoryHistoryModel;
        this.userModel = userModel;
        this.orderItemModel = orderItemModel;
        this.commentModel = commentModel;
        this.sequelize = sequelize;
        this.orderActivityLogger = orderActivityLogger;
        this.activityLog = activityLog;
    }
    computeTotals({ products = [], shipping = 0, gst = 0, extraDiscount = 0, extraDiscountType = 'fixed', }) {
        const subTotal = products.reduce((sum, p) => sum + (p.total ?? 0), 0);
        const totalWithShipping = subTotal + Number(shipping);
        const gstValue = (totalWithShipping * Number(gst)) / 100;
        let extraDiscountValue = 0;
        if (extraDiscount > 0) {
            extraDiscountValue =
                extraDiscountType === 'percent'
                    ? (totalWithShipping * Number(extraDiscount)) / 100
                    : Number(extraDiscount);
        }
        const finalAmount = totalWithShipping + gstValue - extraDiscountValue;
        return { subTotal, totalWithShipping, gstValue, extraDiscountValue, finalAmount };
    }
    async generateDailyOrderNumber(t) {
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();
        const prefix = moment().format('DDMMYY');
        const MAX_ATTEMPTS = 15;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const lastOrder = await this.orderModel.findOne({
                where: {
                    orderNo: { [sequelize_2.Op.like]: `${prefix}%` },
                    createdAt: { [sequelize_2.Op.between]: [todayStart, todayEnd] },
                },
                attributes: ['orderNo'],
                order: [['orderNo', 'DESC']],
                limit: 1,
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            let nextSeq = 101;
            if (lastOrder) {
                const parsed = parseInt(lastOrder.orderNo.slice(prefix.length), 10);
                if (!isNaN(parsed))
                    nextSeq = parsed + 1;
            }
            const candidate = `${prefix}${nextSeq}`;
            const conflict = await this.orderModel.findOne({
                where: { orderNo: candidate },
                transaction: t,
            });
            if (!conflict)
                return candidate;
        }
        throw new Error(`Failed to generate unique order number after ${MAX_ATTEMPTS} attempts`);
    }
    async reduceStockAndLog({ productUpdates, createdBy, orderNo, customMessage, transaction, }) {
        const user = await this.userModel.findByPk(createdBy, {
            attributes: ['username'],
            transaction,
        });
        const username = user?.username || 'System';
        const autoMsg = `Stock removed by ${username} (Order #${orderNo})`;
        const msg = customMessage?.trim() ? `${customMessage} (${autoMsg})` : autoMsg;
        for (const upd of productUpdates) {
            const { productId, quantityToReduce, productRecord } = upd;
            if (quantityToReduce <= 0)
                continue;
            const newQty = productRecord.quantity - quantityToReduce;
            await this.productModel.update({ quantity: newQty }, { where: { productId }, transaction });
            await this.inventoryHistoryModel.create({
                id: (0, uuid_1.v7)(),
                productId,
                change: -quantityToReduce,
                quantityAfter: newQty,
                action: 'sale',
                orderNo: String(orderNo),
                userId: createdBy,
                message: msg,
            }, { transaction });
            let newStatus = 'active';
            if (newQty === 0)
                newStatus = 'out_of_stock';
            else if (productRecord.alert_quantity != null && newQty <= productRecord.alert_quantity)
                newStatus = 'low_stock';
            if (newStatus !== productRecord.status) {
                await this.productModel.update({ status: newStatus }, { where: { productId }, transaction });
            }
        }
    }
    async restoreStock({ products, orderNo }) {
        if (!products?.length)
            return;
        for (const p of products) {
            const prod = await this.productModel.findByPk(p.id || p.productId);
            if (!prod)
                continue;
            const qtyToAdd = p.quantity ?? 0;
            const newQty = prod.quantity + qtyToAdd;
            await this.productModel.update({ quantity: newQty }, { where: { productId: prod.productId } });
            await this.inventoryHistoryModel.create({
                productId: prod.productId,
                change: qtyToAdd,
                quantityAfter: newQty,
                action: 'add-stock',
                orderNo,
                message: `Stock restored (order #${orderNo} cancelled/deleted)`,
            });
        }
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
                    throw new common_1.BadRequestException('Invalid products JSON');
                }
            }
            if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
                await t.rollback();
                throw new common_1.BadRequestException('At least one product is required');
            }
            if (!dto.createdFor) {
                await t.rollback();
                throw new common_1.BadRequestException('createdFor (customer) is required');
            }
            const productIds = [...new Set(incomingProducts.map((p) => p.productId || p.id))];
            const dbProducts = await this.productModel.findAll({
                where: { productId: { [sequelize_2.Op.in]: productIds } },
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            const dbProductMap = new Map(dbProducts.map((p) => [p.productId, p]));
            const missing = productIds.filter((id) => !dbProductMap.has(id));
            if (missing.length > 0) {
                await t.rollback();
                throw new common_1.BadRequestException(`Products not found: ${missing.join(', ')}`);
            }
            const productUpdates = [];
            const enrichedProducts = incomingProducts.map((p) => {
                const record = dbProductMap.get(p.productId || p.id);
                const quantity = Number(p.quantity) || 1;
                if (record.quantity < quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for "${record.name}". Available: ${record.quantity}, Requested: ${quantity}`);
                }
                const price = Number(p.price ?? 0);
                const discount = Number(p.discount ?? 0);
                const discountType = p.discountType || 'percent';
                const tax = Number(p.tax ?? record.tax ?? 0);
                const total = discountType === 'percent'
                    ? price * quantity * (1 - discount / 100) * (1 + tax / 100)
                    : (price - discount) * quantity * (1 + tax / 100);
                productUpdates.push({ productId: record.productId, quantityToReduce: quantity, productRecord: record });
                return {
                    productId: record.productId,
                    name: record.name,
                    productCode: record.product_code,
                    quantity,
                    price,
                    discount,
                    discountType,
                    tax,
                    total: Number(total.toFixed(2)),
                };
            });
            const orderNo = await this.generateDailyOrderNumber(t);
            const shipping = Number(dto.shipping) || 0;
            const gst = Number(dto.gst) || 0;
            const extraDiscount = Number(dto.extraDiscount) || 0;
            const extraDiscountType = dto.extraDiscountType || 'fixed';
            const totals = this.computeTotals({
                products: enrichedProducts,
                shipping,
                gst,
                extraDiscount,
                extraDiscountType,
            });
            const order = await this.orderModel.create({
                orderNo,
                products: enrichedProducts,
                status: 'DRAFT',
                priority: dto.priority || 'medium',
                dueDate: dto.dueDate || null,
                description: dto.description || null,
                source: dto.source || null,
                createdFor: dto.createdFor,
                createdBy: user?.userId,
                assignedUserId: dto.assignedUserId || null,
                assignedTeamId: dto.assignedTeamId || null,
                secondaryUserId: dto.secondaryUserId || null,
                quotationId: dto.quotationId || null,
                shipTo: dto.shipTo || null,
                shipping,
                gst,
                gstValue: totals.gstValue,
                extraDiscount,
                extraDiscountType,
                extraDiscountValue: totals.extraDiscountValue,
                finalAmount: totals.finalAmount,
                amountPaid: 0,
            }, { transaction: t });
            await this.reduceStockAndLog({
                productUpdates,
                createdBy: user?.userId,
                orderNo,
                transaction: t,
            });
            await this.orderItemModel.create({ orderId: order.id, items: enrichedProducts });
            await t.commit();
            this.orderActivityLogger
                .logOrderActivity({
                orderId: order.id,
                orderNo,
                action: 'ORDER_CREATED',
                description: `Order ${orderNo} created`,
                performedBy: user?.userId,
                newValue: { status: 'DRAFT', finalAmount: totals.finalAmount },
            })
                .catch(() => { });
            this.activityLog
                .logActivity({
                userId: user?.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.SALES,
                subContext: activity_log_entity_1.SUB_CONTEXTS.ORDER,
                action: 'CREATE_ORDER',
                entityId: order.id,
                entityName: orderNo,
                description: `Order ${orderNo} created for customer ${dto.createdFor}`,
                metadata: { productCount: enrichedProducts.length, finalAmount: totals.finalAmount },
            })
                .catch(() => { });
            return { message: 'Order created successfully', order: order.toJSON() };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to create order');
        }
    }
    async findAll(query) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 50;
        const offset = (page - 1) * limit;
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.createdFor)
            where.createdFor = query.createdFor;
        if (query.assignedUserId)
            where.assignedUserId = query.assignedUserId;
        const search = query.search?.trim();
        if (search)
            where.orderNo = { [sequelize_2.Op.like]: `%${search}%` };
        const { count: total, rows: orders } = await this.orderModel.findAndCountAll({
            where,
            offset,
            limit,
            order: [['createdAt', 'DESC']],
            distinct: true,
            include: [
                { model: customer_entity_1.Customer, as: 'customer', attributes: ['customerId', 'name', 'companyName'], required: false },
                { model: user_entity_1.User, as: 'creator', attributes: ['userId', 'name', 'username'], required: false },
                { model: user_entity_1.User, as: 'assignedUser', attributes: ['userId', 'name', 'username'], required: false },
            ],
        });
        return {
            data: orders.map((o) => o.toJSON()),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const order = await this.orderModel.findByPk(id, {
            include: [
                { model: customer_entity_1.Customer, as: 'customer', required: false },
                { model: user_entity_1.User, as: 'creator', attributes: ['userId', 'name', 'username'], required: false },
                { model: user_entity_1.User, as: 'assignedUser', attributes: ['userId', 'name', 'username'], required: false },
                { model: order_dispatch_entity_1.OrderDispatch, as: 'dispatches', required: false },
                { model: order_credit_note_entity_1.OrderCreditNote, as: 'creditNotes', required: false },
            ],
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const mongoDoc = await this.orderItemModel.findOne({ orderId: id });
        const items = mongoDoc?.items || order.products || [];
        return { ...order.toJSON(), items };
    }
    async count() {
        const total = await this.orderModel.count();
        return { success: true, total };
    }
    async recent(limit = 5) {
        const orders = await this.orderModel.findAll({
            order: [['createdAt', 'DESC']],
            limit,
        });
        return orders.map((o) => o.toJSON());
    }
    async updateStatus(id, dto, user) {
        const t = await this.sequelize.transaction();
        try {
            const order = await this.orderModel.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!order) {
                await t.rollback();
                throw new common_1.NotFoundException('Order not found');
            }
            const oldStatus = order.status;
            const newStatus = dto.status;
            if (oldStatus === newStatus) {
                await t.rollback();
                return { message: 'Status unchanged', order: order.toJSON() };
            }
            if (newStatus === 'CANCELED' && !['CANCELED', 'CLOSED', 'DELIVERED'].includes(oldStatus)) {
                await this.restoreStock({ products: order.products || [], orderNo: order.orderNo });
            }
            await order.update({ status: newStatus }, { transaction: t });
            await t.commit();
            this.orderActivityLogger
                .logOrderActivity({
                orderId: order.id,
                orderNo: order.orderNo,
                action: 'STATUS_CHANGED',
                description: dto.remarks || `Status changed from ${oldStatus} to ${newStatus}`,
                oldValue: { status: oldStatus },
                newValue: { status: newStatus },
                performedBy: user?.userId,
            })
                .catch(() => { });
            return { message: 'Order status updated successfully', order: order.toJSON() };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to update status');
        }
    }
    async remove(id, user) {
        const t = await this.sequelize.transaction();
        try {
            const order = await this.orderModel.findByPk(id, { transaction: t });
            if (!order) {
                await t.rollback();
                throw new common_1.NotFoundException('Order not found');
            }
            const roles = user.roles || [];
            if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN') && user.userId !== order.createdBy) {
                await t.rollback();
                throw new common_1.BadRequestException('Unauthorized: Only admins, super admins, or the creator can delete this order');
            }
            if (!['CANCELED', 'CLOSED', 'DELIVERED'].includes(order.status)) {
                await this.restoreStock({ products: order.products || [], orderNo: order.orderNo });
            }
            await order.destroy({ transaction: t });
            await t.commit();
            await this.orderItemModel.deleteOne({ orderId: id });
            this.activityLog
                .logActivity({
                userId: user?.userId,
                contextTag: activity_log_entity_1.CONTEXT_TAGS.SALES,
                subContext: activity_log_entity_1.SUB_CONTEXTS.ORDER,
                action: 'DELETE_ORDER',
                entityId: order.id,
                entityName: order.orderNo,
                description: `Order ${order.orderNo} deleted`,
            })
                .catch(() => { });
            return { message: 'Order deleted successfully' };
        }
        catch (error) {
            if (t && !t.finished)
                await t.rollback().catch(() => { });
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || 'Failed to delete order');
        }
    }
    async getComments(orderId) {
        const comments = await this.commentModel
            .find({ resourceType: 'ORDER', resourceId: orderId })
            .sort({ createdAt: -1 })
            .lean();
        return { comments };
    }
    async addComment(orderId, dto, user) {
        const clean = sanitizeHtml(dto.message, { allowedTags: [], allowedAttributes: {} }).trim();
        if (!clean)
            throw new common_1.BadRequestException('Message cannot be empty');
        const userRecord = await this.userModel.findByPk(user.userId, {
            attributes: ['userId', 'name', 'username'],
        });
        const comment = await this.commentModel.create({
            resourceType: 'ORDER',
            resourceId: orderId,
            userId: user.userId,
            userSnapshot: userRecord
                ? { userId: userRecord.userId, name: userRecord.name, username: userRecord.username }
                : { userId: user.userId, name: 'Unknown', username: 'unknown' },
            message: clean,
        });
        return { message: 'Comment added', comment };
    }
    async deleteComment(commentId, user) {
        const comment = await this.commentModel.findById(commentId);
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        const roles = user.roles || [];
        if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN') && comment.userId !== user.userId) {
            throw new common_1.BadRequestException('Unauthorized: cannot delete this comment');
        }
        await comment.deleteOne();
        return { message: 'Comment deleted' };
    }
    updateOrderById() {
        throw new common_1.NotImplementedException('updateOrderById: port from order.controller.js line ~1220 (764 lines - full product/discount/team re-diff logic)');
    }
    getFilteredOrders() {
        throw new common_1.NotImplementedException('getFilteredOrders: port from order.controller.js');
    }
    updateOrderTeam() {
        throw new common_1.NotImplementedException('updateOrderTeam: requires Team model/module (not yet migrated)');
    }
    uploadInvoiceAndLinkOrder() {
        throw new common_1.NotImplementedException('uploadInvoiceAndLinkOrder: port using shared UploadService once file-upload endpoint is wired');
    }
    issueGatePass() {
        throw new common_1.NotImplementedException('issueGatePass: port from order.controller.js');
    }
    downloadInvoice() {
        throw new common_1.NotImplementedException('downloadInvoice: PDF generation, port from order.controller.js');
    }
    downloadOrder() {
        throw new common_1.NotImplementedException('downloadOrder: PDF generation, port from order.controller.js');
    }
    getDownloadDocument() {
        throw new common_1.NotImplementedException('getDownloadDocument: port from order.controller.js');
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(order_entity_1.Order)),
    __param(1, (0, sequelize_1.InjectModel)(product_entity_1.Product)),
    __param(2, (0, sequelize_1.InjectModel)(inventory_history_entity_1.InventoryHistory)),
    __param(3, (0, sequelize_1.InjectModel)(user_entity_1.User)),
    __param(4, (0, mongoose_1.InjectModel)(order_item_schema_1.OrderItem.name)),
    __param(5, (0, mongoose_1.InjectModel)(comment_schema_1.Comment.name)),
    __param(6, (0, sequelize_1.InjectConnection)()),
    __metadata("design:paramtypes", [Object, Object, Object, Object, mongoose_2.Model,
        mongoose_2.Model,
        sequelize_typescript_1.Sequelize,
        order_activity_logger_service_1.OrderActivityLoggerService,
        activity_log_service_1.ActivityLogService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map