import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel as InjectSequelizeModel, InjectConnection } from '@nestjs/sequelize';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { Model as MongoModel } from 'mongoose';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { PurchaseOrder, PO_STATUSES } from './entities/purchase-order.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { PoItem } from './schemas/po-item.schema';
import { validateAndCalculateItems, generateDailyDocNumber, RawPoItemInput } from './helpers/po-shared.helpers';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/purchase-order.dto';

export interface CreatePoFromDataInput {
  vendorId: string;
  items: RawPoItemInput[];
  expectDeliveryDate?: string | Date;
  fgsId?: string;
  createdBy?: string;
}

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectSequelizeModel(PurchaseOrder) private readonly poModel: typeof PurchaseOrder,
    @InjectSequelizeModel(Vendor) private readonly vendorModel: typeof Vendor,
    @InjectSequelizeModel(Product) private readonly productModel: typeof Product,
    @InjectMongoModel(PoItem.name) private readonly poItemModel: MongoModel<PoItem>,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly activityLog: ActivityLogService,
  ) {}

  private async fetchPoItems(poId: string) {
    const doc = await this.poItemModel.findOne({ poId }).lean().exec();
    return (doc as any)?.items || [];
  }

  async create(dto: CreatePurchaseOrderDto, userId?: string) {
    const t = await this.sequelize.transaction();
    let mongoDoc: any = null;
    try {
      if (!dto.vendorId || !Array.isArray(dto.items) || dto.items.length === 0) {
        await t.rollback();
        throw new BadRequestException('vendorId and non-empty items array required');
      }

      const vendor = await this.vendorModel.findByPk(dto.vendorId, { transaction: t });
      if (!vendor) {
        await t.rollback();
        throw new BadRequestException('Vendor not found');
      }

      const { totalAmount, preparedItems } = await validateAndCalculateItems(
        this.productModel,
        dto.items,
        t,
      );
      const poNumber = await generateDailyDocNumber(this.poModel, 'poNumber', 'PO', t);

      const po = await this.poModel.create(
        {
          poNumber,
          vendorId: dto.vendorId,
          userId: userId || null,
          fgsId: dto.fgsId || null,
          status: 'pending',
          orderDate: new Date(),
          expectDeliveryDate: dto.expectDeliveryDate ? new Date(dto.expectDeliveryDate) : null,
          totalAmount,
        } as any,
        { transaction: t },
      );

      mongoDoc = await this.poItemModel.create({
        poId: po.id,
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        items: preparedItems,
        calculatedTotal: totalAmount,
      } as any);

      await po.update({ mongoItemsId: mongoDoc._id.toString() }, { transaction: t });
      await t.commit();

      this.activityLog
        .logActivity({
          userId,
          contextTag: CONTEXT_TAGS.PROCUREMENT,
          subContext: SUB_CONTEXTS.PURCHASE_ORDER,
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
        .catch(() => {});

      return { message: 'Purchase Order created', purchaseOrder: { ...po.toJSON(), items: preparedItems } };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (mongoDoc?._id) await this.poItemModel.deleteOne({ _id: mongoDoc._id }).catch(() => {});
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to create Purchase Order');
    }
  }

  /** Port of createPurchaseOrderFromData() - used by FgsService.convertToPo */
  async createFromData(data: CreatePoFromDataInput, transaction?: Transaction) {
    const t = transaction || (await this.sequelize.transaction());
    const shouldCommit = !transaction;
    let mongoDoc: any = null;

    try {
      const { vendorId, items, expectDeliveryDate, fgsId, createdBy } = data;
      if (!vendorId || !Array.isArray(items) || items.length === 0) {
        throw new BadRequestException('vendorId and non-empty items array required');
      }

      const vendor = await this.vendorModel.findByPk(vendorId, { transaction: t });
      if (!vendor) throw new BadRequestException('Vendor not found');

      const { totalAmount, preparedItems } = await validateAndCalculateItems(
        this.productModel,
        items,
        t,
      );
      const poNumber = await generateDailyDocNumber(this.poModel, 'poNumber', 'PO', t);

      const po = await this.poModel.create(
        {
          poNumber,
          vendorId,
          userId: createdBy || null,
          fgsId: fgsId || null,
          status: 'pending',
          orderDate: new Date(),
          expectDeliveryDate: expectDeliveryDate ? new Date(expectDeliveryDate) : null,
          totalAmount,
        } as any,
        { transaction: t },
      );

      mongoDoc = await this.poItemModel.create({
        poId: po.id,
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        items: preparedItems,
        calculatedTotal: totalAmount,
      } as any);

      await po.update({ mongoItemsId: mongoDoc._id.toString() }, { transaction: t });

      if (shouldCommit) {
        await t.commit();
        this.activityLog
          .logActivity({
            userId: createdBy ?? null,
            contextTag: CONTEXT_TAGS.PROCUREMENT,
            subContext: SUB_CONTEXTS.PURCHASE_ORDER,
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
          .catch(() => {});
      }

      return { purchaseOrder: { ...po.toJSON(), items: preparedItems }, poNumber: po.poNumber };
    } catch (error: any) {
      if (shouldCommit && t && !(t as any).finished) await t.rollback().catch(() => {});
      if (mongoDoc?._id) await this.poItemModel.deleteOne({ _id: mongoDoc._id }).catch(() => {});
      throw error;
    }
  }

  async update(id: string, dto: UpdatePurchaseOrderDto, userId?: string) {
    const t = await this.sequelize.transaction();
    try {
      const po = await this.poModel.findByPk(id, { transaction: t });
      if (!po) {
        await t.rollback();
        throw new NotFoundException('Purchase order not found');
      }
      if (['delivered', 'cancelled'].includes(po.status)) {
        await t.rollback();
        throw new BadRequestException('Cannot modify delivered or cancelled Purchase Order');
      }

      const updateData: any = {};

      if (dto.vendorId) {
        const v = await this.vendorModel.findByPk(dto.vendorId, { transaction: t });
        if (!v) {
          await t.rollback();
          throw new BadRequestException('Vendor not found');
        }
        updateData.vendorId = dto.vendorId;
      }

      if (dto.status) {
        if (!PO_STATUSES.includes(dto.status as any)) {
          await t.rollback();
          throw new BadRequestException('Invalid status');
        }
        updateData.status = dto.status;
      }

      if (dto.expectDeliveryDate !== undefined) {
        updateData.expectDeliveryDate = dto.expectDeliveryDate
          ? new Date(dto.expectDeliveryDate)
          : null;
      }

      let returnedItems: any[] | null = null;
      if (Array.isArray(dto.items) && dto.items.length > 0) {
        const { totalAmount, preparedItems } = await validateAndCalculateItems(
          this.productModel,
          dto.items,
          t,
        );
        updateData.totalAmount = totalAmount;

        await this.poItemModel.findOneAndUpdate(
          { poId: po.id },
          {
            vendorId: updateData.vendorId || po.vendorId,
            items: preparedItems,
            calculatedTotal: totalAmount,
          },
          { upsert: true },
        );
        returnedItems = preparedItems;
      }

      await po.update(updateData, { transaction: t });

      const updated = await this.poModel.findByPk(id, {
        include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'vendorName'] }],
        transaction: t,
      });

      await t.commit();

      this.activityLog
        .logActivity({
          userId: userId ?? po.userId,
          contextTag: CONTEXT_TAGS.PROCUREMENT,
          subContext: SUB_CONTEXTS.PURCHASE_ORDER,
          action: 'UPDATE_PURCHASE_ORDER',
          entityId: updated!.id,
          entityName: po.poNumber,
          description: `Purchase Order ${po.poNumber} updated`,
          metadata: {
            poNumber: po.poNumber,
            changedFields: Object.keys(updateData),
            status: updateData.status || updated!.status,
            totalAmount: updated!.totalAmount,
            vendorId: updateData.vendorId || po.vendorId,
            itemsUpdated: !!dto.items,
          },
        })
        .catch(() => {});

      return {
        message: 'Purchase Order updated',
        purchaseOrder: { ...updated!.toJSON(), items: returnedItems || (await this.fetchPoItems(id)) },
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Update failed');
    }
  }

  async findOne(id: string) {
    const po = await this.poModel.findByPk(id, {
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'vendorName'] },
        { model: User, as: 'createdBy', attributes: ['userId', 'name', 'email', 'username'] },
      ],
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const items = await this.fetchPoItems(po.id);
    return { ...po.toJSON(), items };
  }

  async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await this.poModel.findAndCountAll({
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'vendorName'] },
        { model: User, as: 'createdBy', attributes: ['userId', 'name', 'email', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      subQuery: false,
    });

    const poIds = rows.map((r) => r.id);
    const mongoDocs = await this.poItemModel.find({ poId: { $in: poIds } }).lean();
    const itemsMap = new Map(mongoDocs.map((d: any) => [d.poId, d.items || []]));

    const data = rows.map((po) => ({ ...po.toJSON(), items: itemsMap.get(po.id) || [] }));
    return { data, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
  }

  async findByVendor(vendorId: string) {
    const orders = await this.poModel.findAll({
      where: { vendorId },
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'vendorName'] }],
      order: [['createdAt', 'DESC']],
    });

    const poIds = orders.map((po) => po.id);
    const itemDocs = await this.poItemModel.find({ poId: { $in: poIds } }).lean();
    const itemsMap = new Map(itemDocs.map((d: any) => [d.poId, d.items || []]));

    return orders.map((po) => ({ ...po.toJSON(), items: itemsMap.get(po.id) || [] }));
  }

  async remove(id: string, userId?: string) {
    const t = await this.sequelize.transaction();
    try {
      const po = await this.poModel.findByPk(id, {
        include: [{ model: Vendor, as: 'vendor' }],
        transaction: t,
      });
      if (!po) {
        await t.rollback();
        throw new NotFoundException('Not found');
      }

      await po.destroy({ transaction: t });
      await this.poItemModel.deleteOne({ poId: po.id });

      this.activityLog
        .logActivity({
          userId: userId ?? po.userId,
          contextTag: CONTEXT_TAGS.PROCUREMENT,
          subContext: SUB_CONTEXTS.PURCHASE_ORDER,
          action: 'DELETE_PURCHASE_ORDER',
          entityId: po.id,
          entityName: po.poNumber,
          description: `Purchase Order ${po.poNumber} deleted`,
          oldValues: {
            poNumber: po.poNumber,
            vendorId: po.vendorId,
            vendorName: (po as any).vendor?.vendorName || null,
            totalAmount: po.totalAmount,
            status: po.status,
          },
          metadata: { deletionType: 'HARD_DELETE', warning: 'PO permanently deleted' },
        })
        .catch(() => {});

      await t.commit();
      return { message: 'Purchase Order deleted successfully' };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Delete failed');
    }
  }

  async confirm(id: string, userId?: string) {
    const t = await this.sequelize.transaction();
    try {
      const po = await this.poModel.findByPk(id, { transaction: t });
      if (!po) throw new NotFoundException('Purchase order not found');
      if (!['pending', 'confirmed'].includes(po.status)) {
        throw new BadRequestException('Can only confirm pending or confirmed orders');
      }

      const items = await this.fetchPoItems(po.id);
      if (items.length === 0) throw new BadRequestException('No items in PO');

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
          contextTag: CONTEXT_TAGS.PROCUREMENT,
          subContext: SUB_CONTEXTS.PURCHASE_ORDER,
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
            stockImpact: items.map((i: any) => ({ productId: i.productId, quantityAdded: i.quantity })),
          },
        })
        .catch(() => {});

      return {
        message: 'Purchase Order confirmed and stock updated',
        purchaseOrder: { ...po.toJSON(), status: 'delivered' },
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Confirmation failed');
    }
  }

  async updateStatus(id: string, dto: UpdatePurchaseOrderStatusDto, userId?: string) {
    const t = await this.sequelize.transaction();
    try {
      if (!PO_STATUSES.includes(dto.status as any)) {
        throw new BadRequestException(`Invalid status. Allowed: ${PO_STATUSES.join(', ')}`);
      }

      const po = await this.poModel.findByPk(id, { transaction: t });
      if (!po) throw new NotFoundException('Purchase order not found');
      if (po.status === dto.status) throw new BadRequestException('Status already set');

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
          contextTag: CONTEXT_TAGS.PROCUREMENT,
          subContext: SUB_CONTEXTS.PURCHASE_ORDER,
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
        .catch(() => {});

      return { message: `Status updated to ${dto.status}`, purchaseOrder: { ...po.toJSON(), status: dto.status } };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Status update failed');
    }
  }
}
