// src/field-guided-sheets/field-guided-sheets.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FieldGuidedSheet, FGSStatus } from './entities/field-guided-sheet.entity';
import { FgsItem } from './entities/fgs-item.entity';
import { Product } from '../products/entities/product.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { User } from '../users/entities/user.entity';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { NotificationsService } from 'src/notification/notification.service';
import { CreateFieldGuidedSheetDto } from './dto/create-fgs.dto';
import { UpdateFieldGuidedSheetDto } from './dto/update-fgs.dto';
import * as moment from 'moment';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '2ef0f07a-a275-4fe1-832d-fe9a5d145f60';

@Injectable()
export class FieldGuidedSheetsService {
  constructor(
    @InjectRepository(FieldGuidedSheet)
    private fgsRepository: Repository<FieldGuidedSheet>,

    @InjectRepository(FgsItem)
    private fgsItemRepository: Repository<FgsItem>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,

    private purchaseOrderService: PurchaseOrdersService,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  private async generateDailyFGSNumber(queryRunner: any): Promise<string> {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const prefix = moment().format('DDMMYY');

    let attempt = 0;
    const MAX_ATTEMPTS = 20;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      const lastFGS = await queryRunner.manager.findOne(FieldGuidedSheet, {
        where: {
          fgsNumber: { $like: `FGS${prefix}%` } as any,
          createdAt: { $between: [todayStart, todayEnd] } as any,
        },
        order: { fgsNumber: 'DESC' },
      });

      let nextSeq = 101;
      if (lastFGS) {
        const lastSeq = parseInt(lastFGS.fgsNumber.slice(9), 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }

      const candidate = `FGS${prefix}${nextSeq}`;

      const conflict = await queryRunner.manager.findOne(FieldGuidedSheet, {
        where: { fgsNumber: candidate },
      });

      if (!conflict) return candidate;
    }

    throw new Error(`Failed to generate unique FGS number after ${MAX_ATTEMPTS} attempts`);
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

  async create(dto: CreateFieldGuidedSheetDto, reqUserId?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { vendorId, items, expectDeliveryDate } = dto;

      const vendor = await queryRunner.manager.findOne(Vendor, { where: { id: vendorId } });
      if (!vendor) throw new NotFoundException('Vendor not found');

      const { totalAmount, preparedItems } = await this.validateAndCalculateItems(items, queryRunner);

      const fgsNumber = await this.generateDailyFGSNumber(queryRunner);

      const fgs = queryRunner.manager.create(FieldGuidedSheet, {
        fgsNumber,
        vendorId,
        userId: reqUserId || null,
        status: FGSStatus.DRAFT,
        orderDate: new Date(),
        expectDeliveryDate: expectDeliveryDate ? new Date(expectDeliveryDate) : null,
        totalAmount,
      });

      const savedFGS = await queryRunner.manager.save(fgs);

      // Save items
      const fgsItems = preparedItems.map((item) =>
        queryRunner.manager.create(FgsItem, {
          ...item,
          fgsId: savedFGS.id,
        }),
      );
      await queryRunner.manager.save(fgsItems);

      await queryRunner.commitTransaction();

      await this.notificationsService.sendNotification({
        userId: ADMIN_USER_ID,
        title: `New FGS Created — ${fgsNumber}`,
        message: `${vendor.vendorName || 'Vendor'} • ₹${totalAmount}`,
      });

      return {
        message: 'Field Guided Sheet created',
        fieldGuidedSheet: { ...savedFGS, items: preparedItems },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page = 1, limit = 20) {
    const [rows, count] = await this.fgsRepository.findAndCount({
      relations: ['vendor', 'createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findOne(id: string) {
    const fgs = await this.fgsRepository.findOne({
      where: { id },
      relations: ['vendor', 'createdBy', 'items'],
    });
    if (!fgs) throw new NotFoundException('Field guided sheet not found');
    return fgs;
  }

  async convertToPo(id: string, reqUserId?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fgs = await queryRunner.manager.findOne(FieldGuidedSheet, {
        where: { id },
        relations: ['vendor'],
      });

      if (!fgs) throw new NotFoundException('Field guided sheet not found');
      if (fgs.status !== FGSStatus.APPROVED) {
        throw new BadRequestException('Only approved FGS can be converted to PO');
      }

      const items = await queryRunner.manager.find(FgsItem, { where: { fgsId: id } });
      if (items.length === 0) throw new BadRequestException('No items found in FGS');

      const poData = {
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
        createdBy: reqUserId,
      };

      const poResult = await this.purchaseOrderService.createPurchaseOrderFromData(poData, queryRunner);

      await queryRunner.manager.update(FieldGuidedSheet, id, { status: FGSStatus.CONVERTED });

      await queryRunner.commitTransaction();

      await this.notificationsService.sendNotification({
        userId: ADMIN_USER_ID,
        title: `FGS → PO ${fgs.fgsNumber} → ${poResult.poNumber}`,
        message: `Converted • ${fgs.vendor?.vendorName || '?'} • ₹${fgs.totalAmount}`,
      });

      return {
        message: 'Successfully converted to Purchase Order',
        purchaseOrder: poResult.purchaseOrder,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Implement update, delete, updateStatus similarly using QueryRunner for consistency
}