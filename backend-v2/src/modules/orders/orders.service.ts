import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectModel as InjectSequelizeModel, InjectConnection } from '@nestjs/sequelize';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { Model as MongoModel } from 'mongoose';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import * as moment from 'moment';
import { v7 as uuidv7 } from 'uuid';
import * as sanitizeHtml from 'sanitize-html';

import { Order } from './entities/order.entity';
import { OrderDispatch } from './entities/order-dispatch.entity';
import { OrderCreditNote } from './entities/order-credit-note.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryHistory } from '../products/entities/inventory-history.entity';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { OrderItem } from './schemas/order-item.schema';
import { Comment } from './schemas/comment.schema';
import { OrderActivityLoggerService } from './order-activity-logger.service';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';
import { AddCommentDto, CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

interface RequestUser {
  userId?: string;
  roles?: string[];
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectSequelizeModel(Order) private readonly orderModel: typeof Order,
    @InjectSequelizeModel(Product) private readonly productModel: typeof Product,
    @InjectSequelizeModel(InventoryHistory)
    private readonly inventoryHistoryModel: typeof InventoryHistory,
    @InjectSequelizeModel(User) private readonly userModel: typeof User,
    @InjectMongoModel(OrderItem.name) private readonly orderItemModel: MongoModel<OrderItem>,
    @InjectMongoModel(Comment.name) private readonly commentModel: MongoModel<Comment>,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly orderActivityLogger: OrderActivityLoggerService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // ────────────────────────────────────────────────────────────
  // Helpers (ported from order.controller.js top-level functions)
  // ────────────────────────────────────────────────────────────
  private computeTotals({
    products = [],
    shipping = 0,
    gst = 0,
    extraDiscount = 0,
    extraDiscountType = 'fixed',
  }: {
    products: any[];
    shipping?: number;
    gst?: number;
    extraDiscount?: number;
    extraDiscountType?: string;
  }) {
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

  private async generateDailyOrderNumber(t: Transaction): Promise<string> {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const prefix = moment().format('DDMMYY');

    const MAX_ATTEMPTS = 15;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const lastOrder = await this.orderModel.findOne({
        where: {
          orderNo: { [Op.like]: `${prefix}%` },
          createdAt: { [Op.between]: [todayStart, todayEnd] },
        } as any,
        attributes: ['orderNo'],
        order: [['orderNo', 'DESC']],
        limit: 1,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      let nextSeq = 101;
      if (lastOrder) {
        const parsed = parseInt(lastOrder.orderNo.slice(prefix.length), 10);
        if (!isNaN(parsed)) nextSeq = parsed + 1;
      }

      const candidate = `${prefix}${nextSeq}`;
      const conflict = await this.orderModel.findOne({
        where: { orderNo: candidate },
        transaction: t,
      });
      if (!conflict) return candidate;
    }

    throw new Error(`Failed to generate unique order number after ${MAX_ATTEMPTS} attempts`);
  }

  private async reduceStockAndLog({
    productUpdates,
    createdBy,
    orderNo,
    customMessage,
    transaction,
  }: {
    productUpdates: { productId: string; quantityToReduce: number; productRecord: Product }[];
    createdBy: string;
    orderNo: string;
    customMessage?: string;
    transaction: Transaction;
  }) {
    const user = await this.userModel.findByPk(createdBy, {
      attributes: ['username'],
      transaction,
    });
    const username = user?.username || 'System';

    const autoMsg = `Stock removed by ${username} (Order #${orderNo})`;
    const msg = customMessage?.trim() ? `${customMessage} (${autoMsg})` : autoMsg;

    for (const upd of productUpdates) {
      const { productId, quantityToReduce, productRecord } = upd;
      if (quantityToReduce <= 0) continue;

      const newQty = productRecord.quantity - quantityToReduce;

      await this.productModel.update(
        { quantity: newQty },
        { where: { productId }, transaction },
      );

      await this.inventoryHistoryModel.create(
        {
          id: uuidv7(),
          productId,
          change: -quantityToReduce,
          quantityAfter: newQty,
          action: 'sale',
          orderNo: String(orderNo),
          userId: createdBy,
          message: msg,
        } as any,
        { transaction },
      );

      let newStatus = 'active';
      if (newQty === 0) newStatus = 'out_of_stock';
      else if (productRecord.alert_quantity != null && newQty <= productRecord.alert_quantity)
        newStatus = 'low_stock';

      if (newStatus !== productRecord.status) {
        await this.productModel.update(
          { status: newStatus },
          { where: { productId }, transaction },
        );
      }
    }
  }

  private async restoreStock({ products, orderNo }: { products: any[]; orderNo: string }) {
    if (!products?.length) return;

    for (const p of products) {
      const prod = await this.productModel.findByPk(p.id || p.productId);
      if (!prod) continue;

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
      } as any);
    }
  }

  // ────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────
  async create(dto: CreateOrderDto, user: RequestUser) {
    const t = await this.sequelize.transaction();
    try {
      let incomingProducts: any = dto.products;
      if (typeof incomingProducts === 'string') {
        try {
          incomingProducts = JSON.parse(incomingProducts);
        } catch {
          await t.rollback();
          throw new BadRequestException('Invalid products JSON');
        }
      }
      if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
        await t.rollback();
        throw new BadRequestException('At least one product is required');
      }
      if (!dto.createdFor) {
        await t.rollback();
        throw new BadRequestException('createdFor (customer) is required');
      }

      const productIds = [...new Set(incomingProducts.map((p) => p.productId || p.id))];
      const dbProducts = await this.productModel.findAll({
        where: { productId: { [Op.in]: productIds } } as any,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const dbProductMap = new Map(dbProducts.map((p) => [p.productId, p]));

      const missing = productIds.filter((id) => !dbProductMap.has(id as string));
      if (missing.length > 0) {
        await t.rollback();
        throw new BadRequestException(`Products not found: ${missing.join(', ')}`);
      }

      const productUpdates: any[] = [];
      const enrichedProducts = incomingProducts.map((p) => {
        const record = dbProductMap.get(p.productId || p.id)!;
        const quantity = Number(p.quantity) || 1;

        if (record.quantity < quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${record.name}". Available: ${record.quantity}, Requested: ${quantity}`,
          );
        }

        const price = Number(p.price ?? 0);
        const discount = Number(p.discount ?? 0);
        const discountType = p.discountType || 'percent';
        const tax = Number(p.tax ?? record.tax ?? 0);
        const total =
          discountType === 'percent'
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

      const order = await this.orderModel.create(
        {
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
        } as any,
        { transaction: t },
      );

      await this.reduceStockAndLog({
        productUpdates,
        createdBy: user?.userId as string,
        orderNo,
        transaction: t,
      });

      await this.orderItemModel.create({ orderId: order.id, items: enrichedProducts } as any);

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
        .catch(() => {});

      this.activityLog
        .logActivity({
          userId: user?.userId,
          contextTag: CONTEXT_TAGS.SALES,
          subContext: SUB_CONTEXTS.ORDER,
          action: 'CREATE_ORDER',
          entityId: order.id,
          entityName: orderNo,
          description: `Order ${orderNo} created for customer ${dto.createdFor}`,
          metadata: { productCount: enrichedProducts.length, finalAmount: totals.finalAmount },
        })
        .catch(() => {});

      return { message: 'Order created successfully', order: order.toJSON() };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to create order');
    }
  }

  // ────────────────────────────────────────────────────────────
  // READ
  // ────────────────────────────────────────────────────────────
  async findAll(query: any) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.createdFor) where.createdFor = query.createdFor;
    if (query.assignedUserId) where.assignedUserId = query.assignedUserId;
    const search = query.search?.trim();
    if (search) where.orderNo = { [Op.like]: `%${search}%` };

    const { count: total, rows: orders } = await this.orderModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      distinct: true,
      include: [
        { model: Customer, as: 'customer', attributes: ['customerId', 'name', 'companyName'], required: false },
        { model: User, as: 'creator', attributes: ['userId', 'name', 'username'], required: false },
        { model: User, as: 'assignedUser', attributes: ['userId', 'name', 'username'], required: false },
      ],
    });

    return {
      data: orders.map((o) => o.toJSON()),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const order = await this.orderModel.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', required: false },
        { model: User, as: 'creator', attributes: ['userId', 'name', 'username'], required: false },
        { model: User, as: 'assignedUser', attributes: ['userId', 'name', 'username'], required: false },
        { model: OrderDispatch, as: 'dispatches', required: false },
        { model: OrderCreditNote, as: 'creditNotes', required: false },
      ],
    });
    if (!order) throw new NotFoundException('Order not found');

    const mongoDoc = await this.orderItemModel.findOne({ orderId: id });
    const items = (mongoDoc as any)?.items || order.products || [];

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

  // ────────────────────────────────────────────────────────────
  // STATUS UPDATE (port of updateOrderStatus)
  // ────────────────────────────────────────────────────────────
  async updateStatus(id: string, dto: UpdateOrderStatusDto, user: RequestUser) {
    const t = await this.sequelize.transaction();
    try {
      const order = await this.orderModel.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!order) {
        await t.rollback();
        throw new NotFoundException('Order not found');
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
        .catch(() => {});

      return { message: 'Order status updated successfully', order: order.toJSON() };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to update status');
    }
  }

  // ────────────────────────────────────────────────────────────
  // DELETE
  // ────────────────────────────────────────────────────────────
  async remove(id: string, user: RequestUser) {
    const t = await this.sequelize.transaction();
    try {
      const order = await this.orderModel.findByPk(id, { transaction: t });
      if (!order) {
        await t.rollback();
        throw new NotFoundException('Order not found');
      }

      const roles = user.roles || [];
      if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN') && user.userId !== order.createdBy) {
        await t.rollback();
        throw new BadRequestException(
          'Unauthorized: Only admins, super admins, or the creator can delete this order',
        );
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
          contextTag: CONTEXT_TAGS.SALES,
          subContext: SUB_CONTEXTS.ORDER,
          action: 'DELETE_ORDER',
          entityId: order.id,
          entityName: order.orderNo,
          description: `Order ${order.orderNo} deleted`,
        })
        .catch(() => {});

      return { message: 'Order deleted successfully' };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to delete order');
    }
  }

  // ────────────────────────────────────────────────────────────
  // COMMENTS (Mongo-backed, port of getComments/addComment/deleteComment)
  // ────────────────────────────────────────────────────────────
  async getComments(orderId: string) {
    const comments = await this.commentModel
      .find({ resourceType: 'ORDER', resourceId: orderId })
      .sort({ createdAt: -1 })
      .lean();
    return { comments };
  }

  async addComment(orderId: string, dto: AddCommentDto, user: RequestUser) {
    const clean = sanitizeHtml(dto.message, { allowedTags: [], allowedAttributes: {} }).trim();
    if (!clean) throw new BadRequestException('Message cannot be empty');

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
    } as any);

    return { message: 'Comment added', comment };
  }

  async deleteComment(commentId: string, user: RequestUser) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    const roles = user.roles || [];
    if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN') && comment.userId !== user.userId) {
      throw new BadRequestException('Unauthorized: cannot delete this comment');
    }

    await comment.deleteOne();
    return { message: 'Comment deleted' };
  }

  // ────────────────────────────────────────────────────────────
  // Not yet ported - see docs/MIGRATION_PLAN.md "Orders module"
  // ────────────────────────────────────────────────────────────
  updateOrderById(): never {
    throw new NotImplementedException(
      'updateOrderById: port from order.controller.js line ~1220 (764 lines - full product/discount/team re-diff logic)',
    );
  }
  getFilteredOrders(): never {
    throw new NotImplementedException('getFilteredOrders: port from order.controller.js');
  }
  updateOrderTeam(): never {
    throw new NotImplementedException(
      'updateOrderTeam: requires Team model/module (not yet migrated)',
    );
  }
  uploadInvoiceAndLinkOrder(): never {
    throw new NotImplementedException(
      'uploadInvoiceAndLinkOrder: port using shared UploadService once file-upload endpoint is wired',
    );
  }
  issueGatePass(): never {
    throw new NotImplementedException('issueGatePass: port from order.controller.js');
  }
  downloadInvoice(): never {
    throw new NotImplementedException('downloadInvoice: PDF generation, port from order.controller.js');
  }
  downloadOrder(): never {
    throw new NotImplementedException('downloadOrder: PDF generation, port from order.controller.js');
  }
  getDownloadDocument(): never {
    throw new NotImplementedException('getDownloadDocument: port from order.controller.js');
  }
}
