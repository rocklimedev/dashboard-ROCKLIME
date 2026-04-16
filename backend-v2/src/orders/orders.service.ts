// src/orders/orders.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import * as moment from 'moment';
import { v7 as uuidv7 } from 'uuid';
import { Order, OrderStatus, Priority } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { Address } from 'src/address/entities/address.entity';
import { Quotation } from '../quotations/entities/quotation.entity';
import { InventoryHistory } from 'src/products/entities/inventory-history.entity';
import { NotificationsService } from 'src/notification/notification.service';
import { CreateOrderDto } from './dto/create-order.dto';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '2ef0f07a-a275-4fe1-832d-fe9a5d145f60';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Address)
    private addressRepo: Repository<Address>,

    @InjectRepository(Quotation)
    private quotationRepo: Repository<Quotation>,

    @InjectRepository(InventoryHistory)
    private inventoryHistoryRepo: Repository<InventoryHistory>,

    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  private async generateDailyOrderNumber(queryRunner: any): Promise<string> {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const prefix = moment().format('DDMMYY');

    let attempt = 0;
    const MAX_ATTEMPTS = 15;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      const lastOrder = await queryRunner.manager.findOne(Order, {
        where: {
          orderNo: Like(`${prefix}%`),
          createdAt: { $between: [todayStart, todayEnd] } as any,
        },
        order: { orderNo: 'DESC' },
      });

      let nextSeq = 101;
      if (lastOrder) {
        const seq = parseInt(lastOrder.orderNo.slice(prefix.length), 10);
        if (!isNaN(seq)) nextSeq = seq + 1;
      }

      const candidate = `${prefix}${nextSeq}`;
      const conflict = await queryRunner.manager.findOne(Order, { where: { orderNo: candidate } });

      if (!conflict) return candidate;
    }
    throw new Error(`Failed to generate unique orderNo after ${MAX_ATTEMPTS} attempts`);
  }

  private computeTotals(products: any[], shipping = 0, gst = 0, extraDiscount = 0, extraDiscountType: 'percent' | 'fixed' = 'fixed') {
    const subTotal = products.reduce((sum, p) => sum + (p.total ?? 0), 0);
    const totalWithShipping = subTotal + Number(shipping);
    const gstValue = (totalWithShipping * Number(gst || 0)) / 100;

    let extraDiscountValue = 0;
    if (extraDiscount > 0) {
      extraDiscountValue = extraDiscountType === 'percent'
        ? (totalWithShipping * Number(extraDiscount)) / 100
        : Number(extraDiscount);
    }

    const finalAmount = totalWithShipping + gstValue - extraDiscountValue;

    return { subTotal, gstValue, extraDiscountValue, finalAmount };
  }

  private async reduceStockAndLog(productUpdates: any[], createdBy: string, orderNo: string, transaction: any) {
    const username = (await this.userRepo.findOne({ where: { userId: createdBy }, select: ['username'] }))?.username || 'System';

    for (const upd of productUpdates) {
      const { productId, quantityToReduce } = upd;
      if (quantityToReduce <= 0) continue;

      const product = await transaction.manager.findOne(Product, { where: { productId } });
      if (!product) continue;

      const newQty = product.quantity - quantityToReduce;

      await transaction.manager.update(Product, productId, { quantity: newQty });

      await transaction.manager.save(InventoryHistory, {
        id: uuidv7(),
        productId,
        change: -quantityToReduce,
        quantityAfter: newQty,
        action: 'sale',
        orderNo: String(orderNo),
        userId: createdBy,
        message: `Stock removed by ${username} (Order #${orderNo})`,
      });

      let newStatus = 'active';
      if (newQty === 0) newStatus = 'out_of_stock';
      else if (product.alert_quantity != null && newQty <= product.alert_quantity) newStatus = 'low_stock';

      if (newStatus !== product.status) {
        await transaction.manager.update(Product, productId, { status: newStatus });
      }
    }
  }

  async create(dto: CreateOrderDto, reqUserId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validation
      const customer = await queryRunner.manager.findOne(Customer, { where: { customerId: dto.createdFor } });
      if (!customer) throw new NotFoundException('Customer not found');

      const creator = await queryRunner.manager.findOne(User, { where: { userId: reqUserId } });
      if (!creator) throw new NotFoundException('Creator not found');

      const orderNo = await this.generateDailyOrderNumber(queryRunner);

      // Enrich products + stock check
      const enrichedProducts: any[] = [];
      const productUpdates: any[] = [];

      for (const p of dto.products) {
        const prod = await queryRunner.manager.findOne(Product, { where: { productId: p.productId } });
        if (!prod) throw new NotFoundException(`Product ${p.productId} not found`);
        if (prod.quantity < p.quantity) throw new BadRequestException(`Insufficient stock for ${prod.name}`);

        const price = Number(p.price);
        const quantity = Number(p.quantity);
        const discount = Number(p.discount || 0);
        const discType = p.discountType || 'percent';
        const tax = Number(p.tax || 0);

        const subtotal = price * quantity;
        const discountAmount = discType === 'percent' ? (subtotal * discount) / 100 : discount * quantity;
        const lineTotal = Number((subtotal - discountAmount).toFixed(2));

        enrichedProducts.push({
          productId: p.productId,
          name: prod.name || 'Unknown Product',
          imageUrl: '', // add extraction logic if needed
          productCode: prod.product_code || '',
          companyCode: prod.meta?.['d11da9f9-3f2e-4536-8236-9671200cca4a'] || '',
          quantity,
          price: Number(price.toFixed(2)),
          discount: Number(discount.toFixed(2)),
          discountType: discType,
          tax,
          total: lineTotal,
        });

        productUpdates.push({ productId: p.productId, quantityToReduce: quantity, productRecord: prod });
      }

      const totals = this.computeTotals(enrichedProducts, dto.shipping, dto.gst, dto.extraDiscount, dto.extraDiscountType);

      const order = queryRunner.manager.create(Order, {
        orderNo,
        createdFor: dto.createdFor,
        createdBy: reqUserId,
        status: dto.status || OrderStatus.DRAFT,
        priority: dto.priority || Priority.MEDIUM,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        shipping: dto.shipping || 0,
        gst: dto.gst || 0,
        gstValue: totals.gstValue,
        extraDiscount: dto.extraDiscount || 0,
        extraDiscountType: dto.extraDiscountType,
        extraDiscountValue: totals.extraDiscountValue,
        finalAmount: totals.finalAmount,
        amountPaid: dto.amountPaid || 0,
        shipTo: dto.shipTo || null,
        quotationId: dto.quotationId || null,
        masterPipelineNo: dto.masterPipelineNo || null,
        previousOrderNo: dto.previousOrderNo || null,
        assignedTeamId: dto.assignedTeamId || null,
        assignedUserId: dto.assignedUserId || null,
        secondaryUserId: dto.secondaryUserId || null,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Save OrderItems
      const orderItems = enrichedProducts.map(item => 
        queryRunner.manager.create(OrderItem, { ...item, orderId: savedOrder.id })
      );
      await queryRunner.manager.save(orderItems);

      // Reduce stock + log
      if (productUpdates.length > 0) {
        await this.reduceStockAndLog(productUpdates, reqUserId, orderNo, queryRunner);
      }

      await queryRunner.commitTransaction();

      // Notifications
      await this.notificationsService.sendNotification({
        userId: ADMIN_USER_ID,
        title: `New Order #${orderNo}`,
        message: `Order created for customer ${customer.name}`,
      });

      return {
        message: 'Order created successfully',
        orderNo: savedOrder.orderNo,
        id: savedOrder.id,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ... (updateOrderById, updateOrderStatus, deleteOrder, uploadInvoiceAndLinkOrder, issueGatePass, etc. follow the same pattern with QueryRunner)
}