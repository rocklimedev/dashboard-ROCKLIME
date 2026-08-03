import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Op } from 'sequelize';
import { Model } from 'mongoose';
import { Request } from 'express';
import * as moment from 'moment';
import { Order } from '../../models/order.model';
import {
  User,
  Customer,
  Team,
  Address,
  Quotation,
  Product,
} from '../../models';
import { OrderItem, OrderItemDocument } from '../../models/order-item.schema';
import { Comment } from '../../models/comment.schema';
import { OrderCalculationService } from './order-calculation.service';
import { OrderNumberService } from './order-number.service';
import { InventoryService, ProductUpdate } from './inventory.service';
import { OrderNotificationService } from './order-notification.service';
import { ActivityLogService } from '../../common/activity-log/activity-log.service';
import { CommentsService } from '../../comments/comments.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { GetAllOrdersDto, FilterOrdersDto } from '../dto/filter-orders.dto';

const VALID_STATUSES = [
  'PREPARING',
  'CHECKING',
  'INVOICE',
  'DISPATCHED',
  'DELIVERED',
  'PARTIALLY_DELIVERED',
  'CANCELED',
  'DRAFT',
  'ONHOLD',
  'CLOSED',
];
const VALID_PRIORITIES = ['high', 'medium', 'low'];

const FULL_INCLUDE = [
  { model: Customer, as: 'customer', attributes: ['customerId', 'name'] },
  { model: User, as: 'creator', attributes: ['userId', 'username', 'name'] },
  {
    model: User,
    as: 'assignedUser',
    attributes: ['userId', 'username', 'name'],
  },
  {
    model: User,
    as: 'secondaryUser',
    attributes: ['userId', 'username', 'name'],
  },
  { model: Team, as: 'assignedTeam', attributes: ['id', 'teamName'] },
  { model: Order, as: 'previousOrder', attributes: ['id', 'orderNo'] },
  { model: Order, as: 'masterOrder', attributes: ['id', 'orderNo'] },
  { model: Address, as: 'shippingAddress', attributes: ['addressId'] },
];

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    @InjectModel(Team) private readonly teamModel: typeof Team,
    @InjectModel(Address) private readonly addressModel: typeof Address,
    @InjectModel(Quotation) private readonly quotationModel: typeof Quotation,
    @InjectModel(Product) private readonly productModel: typeof Product,
    @InjectMongoModel(OrderItem.name)
    private readonly orderItemModel: Model<OrderItemDocument>,
    @InjectMongoModel(Comment.name)
    private readonly commentModel: Model<any>,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly calc: OrderCalculationService,
    private readonly orderNumbers: OrderNumberService,
    private readonly inventory: InventoryService,
    private readonly notify: OrderNotificationService,
    private readonly activityLog: ActivityLogService,
    private readonly commentsService: CommentsService,
  ) {}

  // ────────────────────────── CREATE ──────────────────────────

  async createOrder(dto: CreateOrderDto, req?: Request) {
    const t = await this.sequelize.transaction();

    try {
      const { createdFor, createdBy, products } = dto;

      if (!createdFor || !createdBy) {
        throw new BadRequestException('createdFor and createdBy are required');
      }
      if (!Array.isArray(products) || products.length === 0) {
        throw new BadRequestException('Cannot create order without products');
      }

      const [creator, customer] = await Promise.all([
        this.userModel.findByPk(createdBy, {
          attributes: ['userId', 'username', 'name'],
          transaction: t,
        }),
        this.customerModel.findByPk(createdFor, { transaction: t }),
      ]);
      if (!creator) throw new NotFoundException('Creator user not found');
      if (!customer) throw new NotFoundException('Customer not found');

      if (dto.quotationId) {
        const q = await this.quotationModel.findByPk(dto.quotationId, {
          transaction: t,
        });
        if (!q) throw new NotFoundException('Quotation not found');
      }
      if (dto.masterPipelineNo) {
        const m = await this.orderModel.findOne({
          where: { orderNo: dto.masterPipelineNo },
          transaction: t,
        });
        if (!m)
          throw new NotFoundException(
            `Master order ${dto.masterPipelineNo} not found`,
          );
      }
      if (dto.previousOrderNo) {
        const p = await this.orderModel.findOne({
          where: { orderNo: dto.previousOrderNo },
          transaction: t,
        });
        if (!p)
          throw new NotFoundException(
            `Previous order ${dto.previousOrderNo} not found`,
          );
      }

      const productIds = products
        .map((p) => p.id || p.productId)
        .filter(Boolean);
      const sortedProductIds = [...new Set(productIds)].sort();

      const dbProducts = await this.productModel.findAll({
        where: { productId: sortedProductIds },
        attributes: ['productId', 'name', 'images', 'meta', 'product_code'],
        transaction: t,
      });

      const productMap: Record<string, any> = {};
      dbProducts.forEach((p) => {
        let imageUrl = '';
        if (p.images) {
          try {
            const imgs =
              typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
            if (Array.isArray(imgs) && imgs.length > 0)
              imageUrl = imgs[0]?.url || imgs[0] || '';
          } catch {
            /* ignore malformed image payload */
          }
        }
        productMap[p.productId] = {
          name: p.name || 'Unknown Product',
          imageUrl,
          productCode: p.product_code || '',
          companyCode:
            (p.meta && p.meta['d11da9f9-3f2e-4536-8236-9671200cca4a']) || '',
        };
      });

      // Lock products in a consistent order to avoid deadlocks.
      const lockedProducts: Record<string, Product> = {};
      for (const productId of sortedProductIds) {
        const product = await this.productModel.findByPk(productId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!product)
          throw new NotFoundException(`Product not found: ${productId}`);
        lockedProducts[productId] = product;
      }

      const enrichedProducts: any[] = [];
      const productUpdates: ProductUpdate[] = [];

      for (const p of products) {
        const productId = p.id || p.productId;
        if (!productId) throw new BadRequestException('Product ID is required');

        const quantity = Number(p.quantity);
        const price = Number(p.price);
        if (!quantity || quantity < 1) {
          throw new BadRequestException(
            `Invalid quantity for product ${productId}`,
          );
        }
        if (price == null || isNaN(price)) {
          throw new BadRequestException(
            `Invalid price for product ${productId}`,
          );
        }

        const prod = lockedProducts[productId];
        if (prod.quantity < quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${prod.name}". Requested: ${quantity}, Available: ${prod.quantity}`,
          );
        }

        const discount = Number(p.discount) || 0;
        const discountType = p.discountType || 'percent';
        const tax = Number(p.tax) || 0;
        const subtotal = price * quantity;
        const discountAmount =
          discountType === 'percent'
            ? (subtotal * discount) / 100
            : discount * quantity;
        const lineTotal = Number((subtotal - discountAmount).toFixed(2));

        const prodInfo = productMap[productId] || {};

        enrichedProducts.push({
          productId,
          name: p.name || prodInfo.name || prod.name || 'Unknown Product',
          imageUrl: p.imageUrl || prodInfo.imageUrl || '',
          productCode: p.productCode || prodInfo.productCode || '',
          companyCode: p.companyCode || prodInfo.companyCode || '',
          quantity,
          price: Number(price.toFixed(2)),
          discount: Number(discount.toFixed(2)),
          discountType,
          tax,
          total: lineTotal,
        });

        productUpdates.push({
          productId,
          quantityToReduce: quantity,
          productRecord: prod,
        });
      }

      const parsedShipping = parseFloat(String(dto.shipping ?? 0)) || 0;
      const parsedGst =
        dto.gst != null && String(dto.gst) !== ''
          ? parseFloat(String(dto.gst))
          : null;
      const parsedExtraDiscount =
        dto.extraDiscount != null && String(dto.extraDiscount) !== ''
          ? parseFloat(String(dto.extraDiscount))
          : null;
      const finalDiscountType =
        parsedExtraDiscount !== null ? dto.extraDiscountType : null;
      const parsedAmountPaid = parseFloat(String(dto.amountPaid ?? 0)) || 0;

      const { gstValue, extraDiscountValue, finalAmount } =
        this.calc.computeTotals({
          products: enrichedProducts,
          shipping: parsedShipping,
          gst: parsedGst,
          extraDiscount: parsedExtraDiscount,
          extraDiscountType: finalDiscountType,
        });

      const priorityLower = dto.priority
        ? dto.priority.toLowerCase()
        : 'medium';
      const statusUpper = dto.status ? dto.status.toUpperCase() : 'PREPARING';
      const orderNo = await this.orderNumbers.generateDailyOrderNumber(t);

      const order = await this.orderModel.create(
        {
          createdFor,
          createdBy,
          status: statusUpper,
          dueDate: dto.dueDate || null,
          followupDates: Array.isArray(dto.followupDates)
            ? dto.followupDates.filter(Boolean)
            : null,
          source: dto.source || null,
          priority: priorityLower,
          description: dto.description || null,
          orderNo,
          quotationId: dto.quotationId || null,
          masterPipelineNo: dto.masterPipelineNo || null,
          previousOrderNo: dto.previousOrderNo || null,
          shipTo: dto.shipTo || null,
          shipping: parsedShipping,
          assignedTeamId: dto.assignedTeamId || null,
          assignedUserId: dto.assignedUserId || null,
          secondaryUserId: dto.secondaryUserId || null,
          gst: parsedGst,
          gstValue,
          extraDiscount: parsedExtraDiscount,
          extraDiscountType: finalDiscountType,
          extraDiscountValue,
          amountPaid: parsedAmountPaid,
          finalAmount,
          products: enrichedProducts,
        } as any,
        { transaction: t },
      );

      if (productUpdates.length > 0) {
        await this.inventory.reduceStockAndLog({
          productUpdates,
          createdBy,
          orderNo: order.orderNo,
          customMessage: dto.message,
          transaction: t,
        });
      }

      await t.commit();

      await this.activityLog.log({
        userId: createdBy,
        contextTag: 'SALES',
        subContext: 'ORDER',
        action: 'CREATE_ORDER',
        entityId: order.id,
        entityName: order.orderNo,
        description: `Order ${order.orderNo} created for ${customer.name}`,
        metadata: {
          orderNo: order.orderNo,
          customerId: createdFor,
          customerName: customer.name,
          totalAmount: finalAmount,
          productCount: enrichedProducts.length,
          priority: priorityLower,
          status: statusUpper,
          shipping: parsedShipping,
          gst: parsedGst,
          extraDiscount: parsedExtraDiscount,
          assignedUserId: dto.assignedUserId,
          secondaryUserId: dto.secondaryUserId,
        },
        req,
      });

      try {
        await this.orderItemModel.findOneAndUpdate(
          { orderId: order.id },
          {
            orderId: order.id,
            items: enrichedProducts.map((p) => ({
              productId: p.productId,
              name: p.name,
              imageUrl: p.imageUrl,
              productCode: p.productCode,
              companyCode: p.companyCode,
              quantity: p.quantity,
              price: p.price,
              discount: p.discount,
              discountType: p.discountType,
              tax: p.tax,
              total: p.total,
            })),
          },
          { upsert: true },
        );
      } catch (mongoErr) {
        // Non-fatal: Mongo mirror failing shouldn't roll back a committed SQL order.
        // eslint-disable-next-line no-console
        console.error('MongoDB save error:', mongoErr);
      }

      await this.notify.notifyCreated(order, customer.name, creator.name);

      return {
        success: true,
        message: 'Order created successfully',
        id: order.id,
        orderNo: order.orderNo,
      };
    } catch (err: any) {
      try {
        await t.rollback();
      } catch {
        /* transaction already finished */
      }

      if (
        err.name === 'SequelizeDatabaseError' &&
        err.message?.toLowerCase().includes('deadlock')
      ) {
        throw new ConflictException(
          'Database deadlock detected. Please retry the order creation.',
        );
      }
      if (err.message?.toLowerCase().includes('lock wait timeout')) {
        throw new ConflictException(
          'Database is busy processing another order. Please try again.',
        );
      }
      throw err;
    }
  }

  // ────────────────────────── UPDATE ──────────────────────────

  async updateOrderById(id: string, dto: UpdateOrderDto, req?: Request) {
    const updates: Record<string, any> = { ...dto };

    const order = await this.orderModel.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Address, as: 'shippingAddress' },
      ],
    });
    if (!order) throw new NotFoundException('Order not found');

    if (updates.status) {
      const norm = updates.status.toUpperCase();
      if (!VALID_STATUSES.includes(norm)) {
        throw new BadRequestException(`Invalid status: ${updates.status}`);
      }
      if (norm === 'DISPATCHED' && !order.gatePassLink?.trim()) {
        throw new BadRequestException('Gate-pass required before dispatching');
      }
      updates.status = norm;
    }

    if (updates.priority) {
      const p = updates.priority.toLowerCase();
      if (!VALID_PRIORITIES.includes(p)) {
        throw new BadRequestException(`Invalid priority: ${updates.priority}`);
      }
      updates.priority = p;
    }

    if (updates.dueDate !== undefined) {
      if (
        updates.dueDate &&
        !moment(updates.dueDate, 'YYYY-MM-DD', true).isValid()
      ) {
        throw new BadRequestException('Invalid dueDate format (YYYY-MM-DD)');
      }
      updates.dueDate = updates.dueDate || null;
    }

    if (updates.followupDates !== undefined) {
      if (!Array.isArray(updates.followupDates)) {
        throw new BadRequestException('followupDates must be an array');
      }
      const validDates = updates.followupDates.filter(
        (d: string) => d && moment(d, 'YYYY-MM-DD', true).isValid(),
      );
      updates.followupDates = validDates.length > 0 ? validDates : null;
    }

    if (updates.assignedTeamId !== undefined) {
      updates.assignedTeamId = updates.assignedTeamId || null;
      if (updates.assignedTeamId) {
        const team = await this.teamModel.findByPk(updates.assignedTeamId);
        if (!team) throw new NotFoundException('Assigned team not found');
      }
    }

    if (updates.assignedUserId !== undefined) {
      updates.assignedUserId = updates.assignedUserId || null;
      if (updates.assignedUserId) {
        const user = await this.userModel.findByPk(updates.assignedUserId);
        if (!user) throw new NotFoundException('Assigned user not found');
      }
    }

    if (updates.secondaryUserId !== undefined) {
      updates.secondaryUserId = updates.secondaryUserId || null;
      if (updates.secondaryUserId) {
        const user = await this.userModel.findByPk(updates.secondaryUserId);
        if (!user) throw new NotFoundException('Secondary user not found');
      }
    }

    if (updates.masterPipelineNo !== undefined) {
      if (!updates.masterPipelineNo) {
        updates.masterPipelineNo = null;
      } else {
        const m = await this.orderModel.findOne({
          where: { orderNo: updates.masterPipelineNo },
        });
        if (!m) throw new NotFoundException('Master order not found');
        if (updates.masterPipelineNo === order.orderNo) {
          throw new BadRequestException(
            'Master cannot be the same as current order',
          );
        }
      }
    }

    if (updates.previousOrderNo !== undefined) {
      if (!updates.previousOrderNo) {
        updates.previousOrderNo = null;
      } else {
        const p = await this.orderModel.findOne({
          where: { orderNo: updates.previousOrderNo },
        });
        if (!p) throw new NotFoundException('Previous order not found');
        if (updates.previousOrderNo === order.orderNo) {
          throw new BadRequestException(
            'Previous cannot be the same as current order',
          );
        }
      }
    }

    if (updates.quotationId !== undefined) {
      updates.quotationId = updates.quotationId || null;
      if (updates.quotationId) {
        const q = await this.quotationModel.findByPk(updates.quotationId);
        if (!q) throw new NotFoundException('Quotation not found');
      }
    }

    let newProductUpdates: ProductUpdate[] = [];

    if (updates.products !== undefined) {
      if (updates.products === null || updates.products === '') {
        updates.products = [];
      } else if (!Array.isArray(updates.products)) {
        throw new BadRequestException('products must be an array');
      }

      for (const p of updates.products) {
        const {
          id: productId,
          price,
          quantity,
          total,
          discount = 0,
          discountType,
        } = p;

        if (
          !productId ||
          price == null ||
          quantity == null ||
          total == null ||
          quantity < 1
        ) {
          throw new BadRequestException(
            'Each product needs id, price, quantity, and total',
          );
        }

        const prod = await this.productModel.findByPk(productId);
        if (!prod)
          throw new NotFoundException(`Product not found: ${productId}`);

        const finalDiscountType =
          discountType || prod.discountType || 'percent';
        const calculatedTotal = this.calc.expectedLineTotal(
          price,
          quantity,
          discount,
          finalDiscountType,
        );

        if (Math.abs(total - calculatedTotal) > 0.01) {
          throw new BadRequestException(
            `Invalid total for product ${productId}. Expected ${calculatedTotal.toFixed(2)}`,
          );
        }

        const oldQty =
          (order.products as any[])?.find((x) => x.id === productId)
            ?.quantity || 0;
        if (prod.quantity + oldQty < quantity) {
          throw new BadRequestException(`Insufficient stock for ${prod.name}`);
        }

        newProductUpdates.push({
          productId,
          quantityToReduce: quantity,
          productRecord: prod,
        });
      }
    }

    if (updates.shipping !== undefined) {
      const s = parseFloat(updates.shipping) || 0;
      if (s < 0) throw new BadRequestException('Invalid shipping');
      updates.shipping = s;
    }

    if (updates.gst !== undefined) {
      const g = updates.gst === '' ? null : parseFloat(updates.gst);
      if (g !== null && (isNaN(g) || g < 0 || g > 100)) {
        throw new BadRequestException('GST must be 0–100');
      }
      updates.gst = g;
    }

    if (updates.extraDiscount !== undefined) {
      if (
        updates.extraDiscount === null ||
        updates.extraDiscount === undefined ||
        updates.extraDiscount === ''
      ) {
        updates.extraDiscount = null;
        updates.extraDiscountType = null;
      } else {
        const parsed = parseFloat(updates.extraDiscount);
        if (isNaN(parsed) || parsed < 0) {
          throw new BadRequestException(
            'Extra discount must be a positive number or zero',
          );
        }
        updates.extraDiscount = parsed;
      }
    }

    if (updates.extraDiscountType !== undefined) {
      if (updates.extraDiscount == null || updates.extraDiscount === 0) {
        updates.extraDiscountType = null;
      } else if (!['fixed', 'percent'].includes(updates.extraDiscountType)) {
        throw new BadRequestException(
          "extraDiscountType must be 'fixed' or 'percent'",
        );
      }
    }

    if (updates.amountPaid !== undefined) {
      const a = parseFloat(updates.amountPaid) || 0;
      if (isNaN(a) || a < 0)
        throw new BadRequestException('Invalid amountPaid');
      updates.amountPaid = a;
    }

    const { gstValue, extraDiscountValue, finalAmount } =
      this.calc.computeTotals({
        products: updates.products ?? order.products ?? [],
        shipping: updates.shipping ?? order.shipping ?? 0,
        gst: updates.gst ?? order.gst ?? 0,
        extraDiscount: updates.extraDiscount ?? order.extraDiscount ?? 0,
        extraDiscountType:
          updates.extraDiscountType ?? order.extraDiscountType ?? 'fixed',
      });
    updates.gstValue = gstValue;
    updates.extraDiscountValue = extraDiscountValue;
    updates.finalAmount = finalAmount;

    if (newProductUpdates.length > 0) {
      if (order.products?.length > 0) {
        await this.inventory.restoreStock({
          products: order.products,
          orderNo: order.orderNo,
        });
      }
      await this.sequelize.transaction(async (transaction) => {
        await this.inventory.reduceStockAndLog({
          productUpdates: newProductUpdates,
          createdBy: order.createdBy,
          orderNo: order.orderNo,
          transaction,
        });
      });
    }

    await order.update(updates);
    await order.reload();

    await this.activityLog.log({
      userId: (req as any)?.user?.userId || order.createdBy,
      contextTag: 'SALES',
      subContext: 'ORDER',
      action: 'UPDATE_ORDER',
      entityId: order.id,
      entityName: order.orderNo,
      description: `Order ${order.orderNo} updated`,
      metadata: {
        orderNo: order.orderNo,
        changedFields: Object.keys(updates),
        status: updates.status || order.status,
        priority: updates.priority || order.priority,
        finalAmount: updates.finalAmount,
        financialChange: {
          shipping: updates.shipping,
          gst: updates.gst,
          extraDiscount: updates.extraDiscount,
          amountPaid: updates.amountPaid,
        },
        productsChanged: !!updates.products,
        productCount: updates.products?.length || order.products?.length || 0,
        stockRecalculated: newProductUpdates.length > 0,
        stockRestored:
          Array.isArray(order.products) && order.products.length > 0,
      },
      req,
    });

    if (updates.products && updates.products.length > 0) {
      const productIds = updates.products
        .map((p: any) => p.id || p.productId)
        .filter(Boolean);
      const dbProducts = await this.productModel.findAll({
        where: { productId: productIds },
        attributes: ['productId', 'name', 'images'],
      });

      const productMap: Record<string, any> = {};
      dbProducts.forEach((p) => {
        let imageUrl = null;
        if (p.images) {
          try {
            const imgs = JSON.parse(p.images as any);
            if (Array.isArray(imgs) && imgs.length > 0) imageUrl = imgs[0];
          } catch {
            /* ignore malformed image payload */
          }
        }
        productMap[p.productId] = {
          name: p.name || 'Unknown Product',
          imageUrl,
        };
      });

      const mongoItems = updates.products.map((p: any) => {
        const productId = p.id || p.productId;
        const { name, imageUrl } = productMap[productId] || {
          name: 'Unknown Product',
          imageUrl: null,
        };
        return {
          productId,
          name,
          imageUrl,
          quantity: p.quantity,
          price: p.price,
          discount: p.discount ?? 0,
          discountType: p.discountType || 'percent',
          tax: 0,
          total: p.total,
        };
      });

      await this.orderItemModel.findOneAndUpdate(
        { orderId: order.id },
        { orderId: order.id, items: mongoItems },
        { upsert: true },
      );
    }

    const customerName = (order as any).customer?.name || 'Customer';
    const addr = (order as any).shippingAddress
      ? `, ship to ${(order as any).shippingAddress.street || ''}`
      : '';
    await this.notify.notifyUpdated(
      order,
      customerName,
      addr,
      (req as any)?.user?.name || 'someone',
    );

    return { message: 'Order updated successfully', order };
  }

  // ────────────────────────── STATUS ──────────────────────────

  async updateOrderStatus(id: string, status: string, req?: Request) {
    if (!id || !status) throw new BadRequestException('id & status required');

    const order = await this.orderModel.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });
    if (!order) throw new NotFoundException('Order not found');

    const norm = status.toUpperCase();
    if (!VALID_STATUSES.includes(norm))
      throw new BadRequestException(`Invalid status: ${status}`);

    if (norm === 'DISPATCHED' && !order.gatePassLink) {
      throw new BadRequestException(
        'Gate-pass must be uploaded before dispatching the order',
      );
    }

    const oldStatus = order.status;
    order.status = norm;
    await order.save();

    if (['CANCELED', 'CLOSED'].includes(norm) && order.products?.length) {
      await this.inventory.restoreStock({
        products: order.products,
        orderNo: order.orderNo,
      });
    }

    await this.activityLog.log({
      userId: (req as any)?.user?.userId || order.createdBy,
      contextTag: 'SALES',
      subContext: 'ORDER',
      action: 'ORDER_STATUS_UPDATE',
      entityId: order.id,
      entityName: order.orderNo,
      description: `Order ${order.orderNo} status changed: ${oldStatus} → ${norm}`,
      metadata: {
        orderNo: order.orderNo,
        customerName: (order as any).customer?.name || null,
        statusChange: { from: oldStatus, to: norm },
        gatePassRequired: norm === 'DISPATCHED',
        productCount: order.products?.length || 0,
      },
      req,
    });

    await this.notify.notifyStatusChanged(
      order,
      (order as any).customer?.name || 'Customer',
      oldStatus,
      norm,
    );

    return { message: 'Status updated', order };
  }

  // ────────────────────────── DELETE ──────────────────────────

  async deleteOrder(id: string, req?: Request) {
    const order = await this.orderModel.findByPk(id, {
      include: [{ model: Customer, as: 'customer' }],
    });
    if (!order) throw new NotFoundException('Order not found');

    const deps = await this.orderModel.findAll({
      where: {
        [Op.or]: [
          { previousOrderNo: order.orderNo },
          { masterPipelineNo: order.orderNo },
        ],
      },
    });
    if (deps.length) {
      throw new BadRequestException(
        'Order referenced by other orders – cannot delete',
      );
    }

    if (order.products?.length) {
      await this.inventory.restoreStock({
        products: order.products,
        orderNo: order.orderNo,
      });
    }

    await this.notify.notifyDeleted(
      order,
      (order as any).customer?.name || 'Customer',
    );

    await this.commentModel.deleteMany({
      resourceId: id,
      resourceType: 'Order',
    });
    await this.orderItemModel.deleteMany({ orderId: id });

    await order.destroy();

    await this.activityLog.log({
      userId: (req as any)?.user?.userId || order.createdBy,
      contextTag: 'SALES',
      subContext: 'ORDER',
      action: 'DELETE_ORDER',
      entityId: order.id,
      entityName: order.orderNo,
      description: `Order ${order.orderNo} deleted`,
      oldValues: {
        orderId: order.id,
        orderNo: order.orderNo,
        customerName: (order as any).customer?.name,
        finalAmount: order.finalAmount,
        status: order.status,
        productCount: order.products?.length || 0,
      },
      metadata: { mongoCleaned: true, dependencyBlocked: deps.length > 0 },
      req,
    });

    return { message: 'Order deleted' };
  }

  // ────────────────────────── DRAFT ──────────────────────────

  async draftOrder(body: any) {
    const {
      quotationId,
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
      shipTo,
      amountPaid = 0,
    } = body;

    if (!assignedTeamId)
      throw new BadRequestException('assignedTeamId required');

    const team = await this.teamModel.findByPk(assignedTeamId);
    if (!team) throw new BadRequestException('Team not found');

    if (quotationId) {
      const q = await this.quotationModel.findByPk(quotationId);
      if (!q) throw new BadRequestException('Quotation not found');
    }
    if (masterPipelineNo) {
      const m = await this.orderModel.findOne({
        where: { orderNo: masterPipelineNo },
      });
      if (!m)
        throw new NotFoundException(
          `Master order ${masterPipelineNo} not found`,
        );
    }
    if (previousOrderNo) {
      const p = await this.orderModel.findOne({
        where: { orderNo: previousOrderNo },
      });
      if (!p)
        throw new NotFoundException(
          `Previous order ${previousOrderNo} not found`,
        );
    }
    if (shipTo) {
      const a = await this.addressModel.findByPk(shipTo);
      if (!a) throw new NotFoundException(`Address ${shipTo} not found`);
    }

    if (products) {
      if (!Array.isArray(products) || !products.length) {
        throw new BadRequestException('products must be non-empty array');
      }
      for (const p of products) {
        const { id: productId, price, discount, total } = p;
        if (!productId || price == null || discount == null || total == null) {
          throw new BadRequestException(
            'Each product needs id,price,discount,total',
          );
        }
        const prod = await this.productModel.findByPk(productId);
        if (!prod)
          throw new NotFoundException(`Product ${productId} not found`);

        const discType = p.discountType || prod.discountType || 'percent';
        const expected =
          discType === 'percent'
            ? price * (1 - discount / 100)
            : price - discount;
        if (Math.abs(total - expected) > 0.01) {
          throw new BadRequestException(
            `Invalid total for ${productId}. Expected ${expected.toFixed(2)}`,
          );
        }
      }
    }

    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid < 0)
      throw new BadRequestException('Invalid amountPaid');
    if (paid > 0)
      throw new BadRequestException('amountPaid must be 0 for draft orders');

    const orderNo = await this.orderNumbers.generateDraftOrderNumber();

    const order = await this.orderModel.create({
      quotationId,
      status: 'DRAFT',
      assignedTeamId,
      products,
      masterPipelineNo,
      previousOrderNo,
      orderNo,
      shipTo,
      amountPaid: 0,
    } as any);

    const members = await this.userModel.findAll({
      include: [
        { model: this.teamModel, as: 'teams', where: { id: assignedTeamId } },
      ],
      attributes: ['userId', 'name'],
    });

    await this.notify.notifyDraftCreated(
      orderNo,
      assignedTeamId,
      members as any,
    );

    return { message: 'Draft created', order };
  }

  // ────────────────────────── READS ──────────────────────────

  async getAllOrders(query: GetAllOrdersDto) {
    const { page, limit, search = '', status, priority } = query;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (status?.trim()) where.status = status.trim();
    if (priority?.trim()) where.priority = priority.trim();
    if (search?.trim()) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { orderNo: { [Op.like]: searchTerm } },
        { '$customer.name$': { [Op.like]: searchTerm } },
      ];
    }

    const { count: totalOrders, rows: orders } =
      await this.orderModel.findAndCountAll({
        where,
        include: [
          ...FULL_INCLUDE,
          { model: Order, as: 'previousOrder', attributes: ['id', 'orderNo'] },
          { model: Order, as: 'masterOrder', attributes: ['id', 'orderNo'] },
        ],
        order: [['createdAt', 'DESC']],
        offset,
        limit,
        subQuery: false,
      });

    return {
      data: orders.map((o) => o.toJSON()),
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit),
      },
    };
  }

  async getOrderDetails(id: string) {
    const order = await this.orderModel.findByPk(id, {
      include: [
        ...FULL_INCLUDE,
        { model: Order, as: 'nextOrders', attributes: ['id', 'orderNo'] },
        { model: Order, as: 'pipelineOrders', attributes: ['id', 'orderNo'] },
        {
          model: Quotation,
          as: 'quotation',
          attributes: [
            'quotationId',
            'document_title',
            'quotation_date',
            'due_date',
            'followupDates',
            'reference_number',
            'products',
            'discountAmount',
            'roundOff',
            'finalAmount',
            'signature_name',
            'signature_image',
            'createdBy',
            'customerId',
            'shipTo',
          ],
        },
      ],
    });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    const { comments } = await this.commentsService.fetchCommentsWithUsers(
      id,
      'Order',
      1,
      10,
    );
    const orderWithDetails: any = order.toJSON();

    if (order.quotationId && (order as any).quotation) {
      try {
        let quotationProducts = (order as any).quotation.products || [];
        if (typeof quotationProducts === 'string') {
          try {
            quotationProducts = JSON.parse(quotationProducts);
          } catch {
            quotationProducts = [];
          }
        }
        if (!Array.isArray(quotationProducts)) quotationProducts = [];

        orderWithDetails.quotation.products = quotationProducts.map(
          (item: any) => ({
            productId: item.productId,
            name: item.name || 'Unknown Product',
            quantity: item.quantity || 1,
            price: item.price || 0,
            discount: item.discount || 0,
            discountType: item.discountType || 'percent',
            tax: item.tax || 0,
            total: item.total || 0,
          }),
        );

        const q = (order as any).quotation;
        orderWithDetails.quotationDetails = {
          quotationId: q.quotationId,
          document_title: q.document_title,
          quotation_date: q.quotation_date,
          due_date: q.due_date,
          followupDates: q.followupDates,
          reference_number: q.reference_number,
          discountAmount: q.discountAmount || 0,
          roundOff: q.roundOff || 0,
          finalAmount: q.finalAmount || 0,
          signature_name: q.signature_name,
          signature_image: q.signature_image,
          createdBy: q.createdBy,
          customerId: q.customerId,
          shipTo: q.shipTo,
          status: q.status,
        };
      } catch {
        orderWithDetails.quotationDetails = null;
        orderWithDetails.quotation.products = [];
      }
    }

    if (orderWithDetails.products && Array.isArray(orderWithDetails.products)) {
      orderWithDetails.products = orderWithDetails.products.map(
        (item: any) => ({
          productId: item.id || item.productId,
          name: item.name || 'Unknown Product',
          imageUrl: item.imageUrl || '',
          productCode: item.productCode || '',
          companyCode: item.companyCode || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          discount: item.discount || 0,
          discountType: item.discountType || 'percent',
          tax: item.tax || 0,
          total: item.total || item.price * (item.quantity || 1),
        }),
      );
    } else {
      orderWithDetails.products = [];
    }

    orderWithDetails.comments = comments;
    return { order: orderWithDetails };
  }

  async recentOrders() {
    const orders = await this.orderModel.findAll({
      include: FULL_INCLUDE,
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    return { orders };
  }

  async orderById(id: string) {
    const order = await this.orderModel.findByPk(id, {
      include: [
        ...FULL_INCLUDE,
        { model: Order, as: 'nextOrders', attributes: ['id', 'orderNo'] },
        { model: Order, as: 'pipelineOrders', attributes: ['id', 'orderNo'] },
      ],
    });
    if (!order) throw new NotFoundException('Order not found');

    const { comments } = await this.commentsService.fetchCommentsWithUsers(
      id,
      'Order',
      1,
      10,
    );
    return { order: { ...order.toJSON(), comments } };
  }

  async getFilteredOrders(query: FilterOrdersDto) {
    const {
      status,
      priority,
      dueDate,
      createdBy,
      assignedTeamId,
      createdFor,
      search,
      masterPipelineNo,
      previousOrderNo,
      shipTo,
      page,
      limit,
    } = query;

    const filters: any = {};

    if (status) {
      const normalizedStatus = status.toUpperCase();
      filters.status = normalizedStatus;
    }
    if (priority) filters.priority = priority.toLowerCase();

    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime()))
        throw new BadRequestException('Invalid dueDate format');
      filters.dueDate = parsedDate;
    }

    if (createdBy) {
      const user = await this.userModel.findByPk(createdBy);
      if (!user) throw new NotFoundException('Creator user not found');
      filters.createdBy = createdBy;
    }

    if (assignedTeamId) {
      const team = await this.teamModel.findByPk(assignedTeamId);
      if (!team) throw new NotFoundException('Assigned team not found');
      filters.assignedTeamId = assignedTeamId;
    }

    if (createdFor) {
      const customer = await this.customerModel.findByPk(createdFor);
      if (!customer) throw new NotFoundException('Customer not found');
      filters.createdFor = createdFor;
    }

    if (masterPipelineNo) {
      const masterOrder = await this.orderModel.findOne({
        where: { orderNo: masterPipelineNo },
      });
      if (!masterOrder) {
        throw new NotFoundException(
          `Master order with orderNo ${masterPipelineNo} not found`,
        );
      }
      filters.masterPipelineNo = masterPipelineNo;
    }

    if (previousOrderNo) {
      const previousOrder = await this.orderModel.findOne({
        where: { orderNo: previousOrderNo },
      });
      if (!previousOrder) {
        throw new NotFoundException(
          `Previous order with orderNo ${previousOrderNo} not found`,
        );
      }
      filters.previousOrderNo = previousOrderNo;
    }

    if (shipTo) {
      const address = await this.addressModel.findByPk(shipTo);
      if (!address)
        throw new NotFoundException(`Address with ID ${shipTo} not found`);
      filters.shipTo = shipTo;
    }

    const searchFilter = search
      ? {
          [Op.or]: [
            { source: { [Op.like]: `%${search}%` } },
            { '$customer.name$': { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const include = [
      {
        model: Customer,
        as: 'customer',
        attributes: ['customerId', 'name'],
        required: search ? false : undefined,
      },
      {
        model: User,
        as: 'creator',
        attributes: ['userId', 'username', 'name'],
      },
      {
        model: User,
        as: 'assignedUser',
        attributes: ['userId', 'username', 'name'],
      },
      {
        model: User,
        as: 'secondaryUser',
        attributes: ['userId', 'username', 'name'],
      },
      { model: Team, as: 'assignedTeam', attributes: ['id', 'teamName'] },
      { model: Order, as: 'previousOrder', attributes: ['id', 'orderNo'] },
      { model: Order, as: 'masterOrder', attributes: ['id', 'orderNo'] },
      { model: Address, as: 'shippingAddress', attributes: ['addressId'] },
    ];

    const offset = (page - 1) * limit;

    const orders = await this.orderModel.findAll({
      where: { ...filters, ...searchFilter },
      include,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const ordersWithComments = await Promise.all(
      orders.map(async (order) => {
        const { comments } = await this.commentsService.fetchCommentsWithUsers(
          order.id,
          'Order',
          1,
          10,
        );
        return { ...order.toJSON(), comments };
      }),
    );

    const totalCount = await this.orderModel.count({
      where: { ...filters, ...searchFilter },
      include: search ? include : [],
    });

    return { orders: ordersWithComments, totalCount, page, limit };
  }

  // ────────────────────────── TEAM ──────────────────────────

  async updateOrderTeam(id: string, assignedTeamId: string | null) {
    if (!id) throw new BadRequestException('Order ID is required');

    const order = await this.orderModel.findByPk(id, {
      include: [
        { model: Address, as: 'shippingAddress', attributes: ['addressId'] },
      ],
    });
    if (!order) throw new NotFoundException('Order not found');

    if (assignedTeamId) {
      const team = await this.teamModel.findByPk(assignedTeamId);
      if (!team) throw new BadRequestException('Assigned team not found');
    }

    const previousTeamId = order.assignedTeamId;
    order.assignedTeamId = assignedTeamId || null;
    await order.save();

    const customer = await this.customerModel.findByPk(order.createdFor);
    const addressInfo = (order as any).shipToAddress
      ? `, to be shipped to ${(order as any).shipToAddress.address || 'address ID ' + order.shipTo}`
      : '';

    let newTeamMemberIds: string[] = [];
    if (assignedTeamId && assignedTeamId !== previousTeamId) {
      const teamMembers = await this.userModel.findAll({
        include: [
          { model: this.teamModel, as: 'teams', where: { id: assignedTeamId } },
        ],
        attributes: ['userId', 'name'],
      });
      newTeamMemberIds = teamMembers.map((m) => m.userId);
    }

    await this.notify.notifyTeamUpdated(
      order,
      customer?.name || 'Customer',
      addressInfo,
      newTeamMemberIds,
    );

    return { message: 'Order team updated', order };
  }

  async countOrders(date: string) {
    if (!date || !moment(date, 'YYYY-MM-DD').isValid()) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    const count = await this.orderModel.count({
      where: { createdAt: { [Op.gte]: startOfDay, [Op.lte]: endOfDay } },
    });
    return { count };
  }
}
