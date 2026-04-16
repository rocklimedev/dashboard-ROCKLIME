// src/purchase-orders/purchase-orders.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { PurchaseOrder, POStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from 'src/notification/notification.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import * as moment from 'moment';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '2ef0f07a-a275-4fe1-832d-fe9a5d145f60';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private poRepository: Repository<PurchaseOrder>,

    @InjectRepository(PurchaseOrderItem)
    private poItemRepository: Repository<PurchaseOrderItem>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  private async generateDailyPONumber(queryRunner: any): Promise<string> {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const prefix = moment().format('DDMMYY');

    let attempt = 0;
    const MAX_ATTEMPTS = 20;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      const lastPO = await queryRunner.manager.findOne(PurchaseOrder, {
        where: {
          poNumber: ILike(`PO${prefix}%`),
          createdAt: { $between: [todayStart, todayEnd] } as any,
        },
        order: { poNumber: 'DESC' },
      });

      let nextSeq = 101;
      if (lastPO) {
        const lastSeq = parseInt(lastPO.poNumber.slice(8), 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }

      const candidate = `PO${prefix}${nextSeq}`;

      const conflict = await queryRunner.manager.findOne(PurchaseOrder, {
        where: { poNumber: candidate },
      });

      if (!conflict) return candidate;
    }

    throw new Error(`Failed to generate unique PO number after ${MAX_ATTEMPTS} attempts`);
  }

  private async validateAndCalculateItems(items: any[], queryRunner: any) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items must be a non-empty array');
    }

    let total = 0;
    const prepared: any[] = [];

    for (const item of items) {
      if (!item.productId) throw new BadRequestException('Every item must have productId');

      const product = await queryRunner.manager.findOne(Product, { where: { productId: item.productId } });
      if (!product) throw new BadRequestException(`Product not found: ${item.productId}`);

      const qty = Number(item.quantity);
      if (qty <= 0 || isNaN(qty)) throw new BadRequestException(`Invalid quantity for ${item.productId}`);

      const price = Number(item.unitPrice ?? item.mrp ?? 0);
      if (price <= 0 || isNaN(price)) throw new BadRequestException(`Invalid unit price for ${item.productId}`);

      const lineTotal = qty * price;
      total += lineTotal;

      let imageUrl: string | null = null;
      if (product.images) {
        if (Array.isArray(product.images) && product.images.length > 0) {
          imageUrl = product.images[0];
        } else if (typeof product.images === 'string') {
          try {
            const parsed = JSON.parse(product.images);
            if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
          } catch {}
        }
      }

      prepared.push({
        productId: item.productId,
        productName: product.name || 'Unnamed',
        companyCode: product.meta?.['d11da9f9-3f2e-4536-8236-9671200cca4a'] || null,
        productCode: product.product_code || product.code || '',
        imageUrl,
        quantity: qty,
        unitPrice: price,
        mrp: Number(item.mrp ?? product.mrp ?? price),
        discount: Number(item.discount ?? 0),
        discountType: item.discountType || 'percent',
        tax: Number(item.tax ?? 0),
        total: lineTotal,
      });
    }

    return {
      totalAmount: Number(total.toFixed(2)),
      preparedItems: prepared,
    };
  }

  async create(dto: CreatePurchaseOrderDto, reqUserId?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { vendorId, items, expectDeliveryDate, fgsId } = dto;

      const vendor = await queryRunner.manager.findOne(Vendor, { where: { id: vendorId } });
      if (!vendor) throw new NotFoundException('Vendor not found');

      const { totalAmount, preparedItems } = await this.validateAndCalculateItems(items, queryRunner);

      const poNumber = await this.generateDailyPONumber(queryRunner);

      const po = queryRunner.manager.create(PurchaseOrder, {
        poNumber,
        vendorId,
        userId: reqUserId || null,
        fgsId: fgsId || null,
        status: POStatus.PENDING,
        orderDate: new Date(),
        expectDeliveryDate: expectDeliveryDate ? new Date(expectDeliveryDate) : null,
        totalAmount,
      });

      const savedPO = await queryRunner.manager.save(po);

      // Save items
      const poItems = preparedItems.map((item) =>
        queryRunner.manager.create(PurchaseOrderItem, {
          ...item,
          poId: savedPO.id,
        }),
      );
      await queryRunner.manager.save(poItems);

      await queryRunner.commitTransaction();

      // Notification
      await this.notificationsService.sendNotification({
        userId: ADMIN_USER_ID,
        title: `New PO Created — ${poNumber}`,
        message: `${vendor.vendorName || 'Vendor'} • ₹${totalAmount}`,
      });

      return {
        message: 'Purchase Order created',
        purchaseOrder: { ...savedPO, items: preparedItems },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Update, Get All, Get By Id, Delete, Confirm, Update Status, etc. — can be added similarly

  // For brevity, here are the key methods:

  async findAll(page = 1, limit = 20) {
    const [rows, count] = await this.poRepository.findAndCount({
      relations: ['vendor', 'createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }

  async findOne(id: string) {
    const po = await this.poRepository.findOne({
      where: { id },
      relations: ['vendor', 'createdBy', 'items'],
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  // ... (update, delete, confirmPurchaseOrder, updateStatus, getByVendor, createFromData)

  async confirmPurchaseOrder(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const po = await queryRunner.manager.findOne(PurchaseOrder, { where: { id } });
      if (!po) throw new NotFoundException('Purchase order not found');

      if (![POStatus.PENDING, POStatus.CONFIRMED].includes(po.status)) {
        throw new BadRequestException('Can only confirm pending or confirmed orders');
      }

      const items = await queryRunner.manager.find(PurchaseOrderItem, { where: { poId: id } });

      for (const item of items) {
        const product = await queryRunner.manager.findOne(Product, { where: { productId: item.productId } });
        if (product) {
          product.quantity = Number(product.quantity || 0) + item.quantity;
          await queryRunner.manager.save(product);
        }
      }

      po.status = POStatus.DELIVERED;
      await queryRunner.manager.save(po);

      await queryRunner.commitTransaction();

      await this.notificationsService.sendNotification({
        userId: ADMIN_USER_ID,
        title: `PO Confirmed & Delivered — ${po.poNumber}`,
        message: `₹${po.totalAmount}`,
      });

      return { message: 'Purchase Order confirmed and stock updated', purchaseOrder: po };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}