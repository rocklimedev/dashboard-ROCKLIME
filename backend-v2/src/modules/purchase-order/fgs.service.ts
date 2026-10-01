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
import { FieldGuidedSheet, FGS_STATUSES } from './entities/fgs.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { FgsItem } from './schemas/fgs-item.schema';
import { validateAndCalculateItems, generateDailyDocNumber } from './helpers/po-shared.helpers';
import { PurchaseOrderService } from './purchase-order.service';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';
import { CreateFgsDto, UpdateFgsDto, UpdateFgsStatusDto } from './dto/purchase-order.dto';

@Injectable()
export class FgsService {
  constructor(
    @InjectSequelizeModel(FieldGuidedSheet)
    private readonly fgsModel: typeof FieldGuidedSheet,
    @InjectSequelizeModel(Vendor) private readonly vendorModel: typeof Vendor,
    @InjectSequelizeModel(Product) private readonly productModel: typeof Product,
    @InjectMongoModel(FgsItem.name) private readonly fgsItemModel: MongoModel<FgsItem>,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly activityLog: ActivityLogService,
  ) {}

  private async fetchFgsItems(fgsId: string) {
    const doc = await this.fgsItemModel.findOne({ fgsId }).lean().exec();
    return (doc as any)?.items || [];
  }

  async create(dto: CreateFgsDto, userId?: string) {
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

      const fgsNumber = await generateDailyDocNumber(this.fgsModel, 'fgsNumber', 'FGS', t);

      const fgs = await this.fgsModel.create(
        {
          fgsNumber,
          vendorId: dto.vendorId,
          userId: userId || null,
          status: 'draft',
          orderDate: new Date(),
          expectDeliveryDate: dto.expectDeliveryDate ? new Date(dto.expectDeliveryDate) : null,
          totalAmount,
        } as any,
        { transaction: t },
      );

      mongoDoc = await this.fgsItemModel.create({
        fgsId: fgs.id,
        fgsNumber: fgs.fgsNumber,
        vendorId: fgs.vendorId,
        items: preparedItems,
        calculatedTotal: totalAmount,
      } as any);

      await fgs.update({ mongoItemsId: mongoDoc._id.toString() }, { transaction: t });

      await t.commit();

      this.activityLog
        .logActivity({
          userId,
          contextTag: CONTEXT_TAGS.PROCUREMENT,
          subContext: SUB_CONTEXTS.FIELD_GUIDED_SHEET,
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
        .catch(() => {});

      // NOTE: legacy also sent an admin notification here - TODO once
      // NotificationsModule is migrated.

      return {
        message: 'Field Guided Sheet created',
        fieldGuidedSheet: { ...fgs.toJSON(), items: preparedItems },
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (mongoDoc?._id) {
        await this.fgsItemModel.deleteOne({ _id: mongoDoc._id }).catch(() => {});
      }
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to create Field Guided Sheet');
    }
  }

  async update(id: string, dto: UpdateFgsDto, userId?: string) {
    const t = await this.sequelize.transaction();
    try {
      const fgs = await this.fgsModel.findByPk(id, { transaction: t });
      if (!fgs) {
        await t.rollback();
        throw new NotFoundException('Field guided sheet not found');
      }
      if (fgs.status === 'converted') {
        await t.rollback();
        throw new BadRequestException('Cannot modify converted Field Guided Sheet');
      }

      const oldSnapshot = fgs.toJSON();
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
        if (!FGS_STATUSES.includes(dto.status as any)) {
          await t.rollback();
          throw new BadRequestException('Invalid status');
        }
        if (dto.status === 'converted') {
          await t.rollback();
          throw new BadRequestException('Use /convert endpoint to convert to PO');
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

        await this.fgsItemModel.findOneAndUpdate(
          { fgsId: fgs.id },
          {
            vendorId: updateData.vendorId || fgs.vendorId,
            items: preparedItems,
            calculatedTotal: totalAmount,
          },
          { upsert: true, new: true },
        );

        returnedItems = preparedItems;
      }

      await fgs.update(updateData, { transaction: t });

      const updated = await this.fgsModel.findByPk(id, {
        include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'vendorName'] }],
        transaction: t,
      });

      await t.commit();

      this.activityLog
        .logActivity({
          userId: userId ?? null,
          contextTag: CONTEXT_TAGS.PROCUREMENT,
          subContext: SUB_CONTEXTS.FIELD_GUIDED_SHEET,
          action: 'UPDATE',
          entityId: updated!.id,
          entityName: updated!.fgsNumber,
          description: `FGS updated: ${updated!.fgsNumber}`,
          oldValues: oldSnapshot,
          newValues: updated!.toJSON(),
          metadata: { updatedFields: Object.keys(updateData), itemUpdated: !!returnedItems },
        })
        .catch(() => {});

      return {
        message: 'Field Guided Sheet updated',
        fieldGuidedSheet: {
          ...updated!.toJSON(),
          items: returnedItems || (await this.fetchFgsItems(id)),
        },
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Update failed');
    }
  }

  async findOne(id: string) {
    const fgs = await this.fgsModel.findByPk(id, {
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'vendorName'] },
        { model: User, as: 'createdBy', attributes: ['userId', 'name', 'email', 'username'] },
      ],
    });
    if (!fgs) throw new NotFoundException('Field guided sheet not found');

    const items = await this.fetchFgsItems(fgs.id);
    return { ...fgs.toJSON(), items };
  }

  async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;

    const { count, rows } = await this.fgsModel.findAndCountAll({
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'vendorName'] },
        { model: User, as: 'createdBy', attributes: ['userId', 'name', 'email', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      subQuery: false,
    });

    const fgsIds = rows.map((r) => r.id);
    const mongoDocs = await this.fgsItemModel.find({ fgsId: { $in: fgsIds } }).lean();
    const itemsMap = new Map(mongoDocs.map((d: any) => [d.fgsId, d.items || []]));

    const data = rows.map((fgs) => ({
      ...fgs.toJSON(),
      items: itemsMap.get(fgs.id) || [],
    }));

    return { data, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } };
  }

  async remove(id: string, userId?: string) {
    const t = await this.sequelize.transaction();
    let snapshot: any;
    try {
      const fgs = await this.fgsModel.findByPk(id, {
        include: [{ model: Vendor, as: 'vendor' }],
        transaction: t,
      });
      if (!fgs) {
        await t.rollback();
        throw new NotFoundException('Not found');
      }

      snapshot = {
        id: fgs.id,
        fgsNumber: fgs.fgsNumber,
        vendorId: fgs.vendorId,
        totalAmount: fgs.totalAmount,
      };

      await fgs.destroy({ transaction: t });
      await t.commit();
    } catch (error: any) {
      await t.rollback().catch(() => {});
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Delete failed');
    }

    await this.fgsItemModel.deleteOne({ fgsId: snapshot.id }).catch(() => {});
    this.activityLog
      .logActivity({
        userId: userId ?? null,
        contextTag: CONTEXT_TAGS.PROCUREMENT,
        subContext: SUB_CONTEXTS.FIELD_GUIDED_SHEET,
        action: 'DELETE',
        entityId: snapshot.id,
        entityName: snapshot.fgsNumber,
        description: `FGS deleted: ${snapshot.fgsNumber}`,
        oldValues: snapshot,
        metadata: { vendorId: snapshot.vendorId, totalAmount: snapshot.totalAmount },
      })
      .catch(() => {});

    return { message: 'Field Guided Sheet deleted successfully' };
  }

  async convertToPo(id: string, userId?: string) {
    const t = await this.sequelize.transaction();
    try {
      const fgs = await this.fgsModel.findByPk(id, {
        include: [{ model: Vendor, as: 'vendor' }],
        transaction: t,
      });
      if (!fgs) throw new BadRequestException('Field guided sheet not found');
      if (fgs.status !== 'approved') {
        throw new BadRequestException('Only approved FGS can be converted to PO');
      }

      const items = await this.fetchFgsItems(fgs.id);
      if (items.length === 0) throw new BadRequestException('No items found in FGS');

      const poResult = await this.purchaseOrderService.createFromData(
        {
          vendorId: fgs.vendorId,
          items: items.map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            mrp: i.mrp,
            discount: i.discount,
            discountType: i.discountType,
            tax: i.tax,
          })),
          expectDeliveryDate: fgs.expectDeliveryDate as any,
          fgsId: fgs.id,
          createdBy: userId,
        },
        t,
      );

      if (!poResult?.purchaseOrder) throw new Error('Failed to create Purchase Order');

      await fgs.update({ status: 'converted' }, { transaction: t });
      await t.commit();

      return {
        message: 'Successfully converted to Purchase Order',
        purchaseOrder: poResult.purchaseOrder,
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Conversion failed');
    }
  }

  async updateStatus(id: string, dto: UpdateFgsStatusDto, userId?: string) {
    const t = await this.sequelize.transaction();
    let fgs: FieldGuidedSheet | null = null;
    let oldStatus: string;
    let vendor: Vendor | null = null;

    try {
      if (!FGS_STATUSES.includes(dto.status as any)) {
        throw new BadRequestException(`Invalid status. Allowed: ${FGS_STATUSES.join(', ')}`);
      }

      fgs = await this.fgsModel.findByPk(id, { transaction: t });
      if (!fgs) throw new NotFoundException('Not found');

      oldStatus = fgs.status;
      if (oldStatus === dto.status) {
        throw new BadRequestException('Status is already set to this value');
      }
      if (dto.status === 'converted') {
        throw new BadRequestException('Use /convert endpoint to convert to PO');
      }

      await fgs.update({ status: dto.status }, { transaction: t });
      vendor = await this.vendorModel.findByPk(fgs.vendorId, { transaction: t });

      await t.commit();
    } catch (error: any) {
      await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Status update failed');
    }

    this.activityLog
      .logActivity({
        userId: userId ?? null,
        contextTag: CONTEXT_TAGS.PROCUREMENT,
        subContext: SUB_CONTEXTS.FIELD_GUIDED_SHEET,
        action: 'STATUS_UPDATE',
        entityId: fgs.id,
        entityName: fgs.fgsNumber,
        description: `FGS status changed: ${oldStatus!} -> ${fgs.status}`,
        oldValues: { status: oldStatus! },
        newValues: { status: fgs.status },
        metadata: { vendorId: fgs.vendorId, vendorName: vendor?.vendorName || null },
      })
      .catch(() => {});

    return { message: `Status updated to ${fgs.status}`, fieldGuidedSheet: fgs.toJSON() };
  }
}
