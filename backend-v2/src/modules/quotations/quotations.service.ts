import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel as InjectSequelizeModel, InjectConnection } from '@nestjs/sequelize';
import { InjectModel as InjectMongoModel } from '@nestjs/mongoose';
import { Model as MongoModel } from 'mongoose';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import { Quotation } from './entities/quotation.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { QuotationItem } from './schemas/quotation-item.schema';
import { QuotationVersion } from './schemas/quotation-version.schema';
import { calculateTotals } from './helpers/calculation.helpers';
import { buildFloorsFromProducts } from './helpers/misc.helpers';
import { QuotationNumberService } from './services/quotation-number.service';
import { VersioningService } from './services/versioning.service';
import { ProductEnrichmentService } from './services/product-enrichment.service';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CONTEXT_TAGS, SUB_CONTEXTS } from '../engagement/entities/activity-log.entity';
import { CreateQuotationDto, UpdateQuotationDto } from './dto/quotation.dto';

interface RequestUser {
  userId?: string;
  roles?: string[];
}

@Injectable()
export class QuotationsService {
  constructor(
    @InjectSequelizeModel(Quotation) private readonly quotationModel: typeof Quotation,
    @InjectMongoModel(QuotationItem.name)
    private readonly quotationItemModel: MongoModel<QuotationItem>,
    @InjectMongoModel(QuotationVersion.name)
    private readonly quotationVersionModel: MongoModel<QuotationVersion>,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly numberService: QuotationNumberService,
    private readonly versioningService: VersioningService,
    private readonly enrichmentService: ProductEnrichmentService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(dto: CreateQuotationDto, user: RequestUser) {
    const t = await this.sequelize.transaction();
    try {
      let incomingProducts: any = dto.products;
      if (typeof incomingProducts === 'string') {
        try {
          incomingProducts = JSON.parse(incomingProducts);
        } catch {
          await t.rollback();
          throw new BadRequestException('Invalid products JSON format');
        }
      }
      if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
        await t.rollback();
        throw new BadRequestException('At least one product is required');
      }
      if (!dto.customerId) {
        await t.rollback();
        throw new BadRequestException('Customer ID is required');
      }

      const dueDate = !dto.due_date || dto.due_date === 'null' ? null : dto.due_date;
      const extraDiscount = Number(dto.extraDiscount) || 0;
      const extraDiscountType = dto.extraDiscountType || 'percent';
      const shippingAmount = Number(dto.shippingAmount) || 0;
      const gst = Number(dto.gst) || 0;
      const incomingFloors = dto.floors || [];

      const productIds = [
        ...new Set(incomingProducts.map((p) => p.productId || p.id).filter(Boolean)),
      ];
      const productMap = await this.enrichmentService.fetchProductMap(productIds, t);
      const enrichedProducts = this.enrichmentService.enrichProductsForCreate(
        incomingProducts,
        productMap,
      );

      const floors =
        Array.isArray(incomingFloors) && incomingFloors.length > 0
          ? incomingFloors
          : buildFloorsFromProducts(enrichedProducts);

      const totals = calculateTotals(enrichedProducts, extraDiscount, extraDiscountType as any, shippingAmount, gst);
      const reference_number = await this.numberService.generateQuotationNumber(t);

      const quotation = await this.quotationModel.create(
        {
          customerId: dto.customerId,
          reference_number,
          document_title: dto.document_title || 'Quotation',
          quotation_date: dto.quotation_date || new Date().toISOString().split('T')[0],
          due_date: dueDate,
          products: enrichedProducts,
          floors,
          optionalTotal: totals.optionalTotal,
          optionalItemsCount: totals.optionalItemsCount,
          totalFloors: floors.length,
          extraDiscount,
          extraDiscountType,
          discountAmount: totals.extraDiscountAmount,
          shippingAmount,
          gst,
          gstAmount: totals.gstAmount,
          roundOff: totals.roundOff,
          finalAmount: totals.finalAmount,
          shipTo: dto.shipTo || null,
          signature_name: dto.signature_name || '',
          signature_image: dto.signature_image || '',
          createdBy: user?.userId,
        } as any,
        { transaction: t },
      );

      await this.quotationItemModel.create({
        quotationId: quotation.quotationId,
        items: enrichedProducts,
      } as any);

      await t.commit();

      this.activityLog
        .logActivity({
          userId: user?.userId,
          contextTag: CONTEXT_TAGS.SALES,
          subContext: SUB_CONTEXTS.QUOTATION,
          action: 'CREATE_QUOTATION',
          entityId: quotation.quotationId,
          entityName: quotation.reference_number,
          description: `Quotation ${quotation.reference_number} created for customer ${dto.customerId}`,
          metadata: {
            referenceNumber: quotation.reference_number,
            customerId: dto.customerId,
            productCount: enrichedProducts.length,
            floorCount: floors.length,
            financials: {
              totalAmount: totals.finalAmount,
              gst,
              gstAmount: totals.gstAmount,
              discount: extraDiscount,
              discountType: extraDiscountType,
              shipping: shippingAmount,
            },
          },
        })
        .catch(() => {});

      return {
        message: 'Quotation created successfully',
        quotation: { ...quotation.toJSON(), finalAmount: totals.finalAmount },
        calculated: totals,
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to create quotation');
    }
  }

  async update(id: string, dto: UpdateQuotationDto, user: RequestUser) {
    const t = await this.sequelize.transaction();
    try {
      const currentQuotation = await this.quotationModel.findOne({
        where: { quotationId: id },
        transaction: t,
      });
      if (!currentQuotation) {
        await t.rollback();
        throw new NotFoundException('Quotation not found');
      }

      const newVersionNumber = await this.versioningService.createVersionSnapshot(
        id,
        user?.userId,
        t,
      );

      let incomingProducts: any = dto.products;
      if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
        await t.rollback();
        throw new BadRequestException('At least one product is required');
      }

      const extraDiscount = Number(dto.extraDiscount) || 0;
      const extraDiscountType = dto.extraDiscountType || 'percent';
      const shippingAmount = Number(dto.shippingAmount) || 0;
      const gst = Number(dto.gst) || 0;
      const followupDates = dto.followupDates || [];

      const productIds = [
        ...new Set(incomingProducts.map((p) => p.productId || p.id).filter(Boolean)),
      ];
      const productMap = await this.enrichmentService.fetchProductMapForUpdate(productIds, t);
      const enrichedProducts = this.enrichmentService.enrichProductsForUpdate(
        incomingProducts,
        productMap,
      );

      const floors =
        Array.isArray(dto.floors) && dto.floors.length > 0
          ? dto.floors
          : buildFloorsFromProducts(enrichedProducts);

      const totals = calculateTotals(enrichedProducts, extraDiscount, extraDiscountType as any, shippingAmount, gst);

      const { products: _p, floors: _f, ...rest } = dto as any;

      await this.quotationModel.update(
        {
          ...rest,
          products: enrichedProducts,
          floors,
          totalFloors: floors.length,
          extraDiscount,
          extraDiscountType,
          discountAmount: totals.extraDiscountAmount,
          shippingAmount,
          gst,
          gstAmount: totals.gstAmount,
          roundOff: totals.roundOff,
          finalAmount: totals.finalAmount,
          followupDates: followupDates.length > 0 ? followupDates : null,
        },
        { where: { quotationId: id }, transaction: t },
      );

      try {
        if (enrichedProducts.length > 0) {
          await this.quotationItemModel.updateOne(
            { quotationId: id },
            { $set: { items: enrichedProducts } },
            { upsert: true },
          );
        } else {
          await this.quotationItemModel.deleteOne({ quotationId: id });
        }
      } catch (mongoErr) {
        console.error('MongoDB sync failed:', mongoErr);
      }

      await t.commit();

      this.activityLog
        .logActivity({
          userId: user?.userId,
          contextTag: CONTEXT_TAGS.SALES,
          subContext: SUB_CONTEXTS.QUOTATION,
          action: 'UPDATE_QUOTATION',
          entityId: currentQuotation.quotationId,
          entityName: currentQuotation.reference_number || id,
          description: `Quotation ${id} updated (version ${newVersionNumber})`,
          oldValues: {
            finalAmount: currentQuotation.finalAmount,
            extraDiscount: currentQuotation.extraDiscount,
            gst: currentQuotation.gst,
            shippingAmount: currentQuotation.shippingAmount,
          },
          newValues: { finalAmount: totals.finalAmount, extraDiscount, gst, shippingAmount },
          metadata: {
            quotationId: id,
            version: newVersionNumber,
            productCount: enrichedProducts.length,
            floorCount: floors.length,
          },
        })
        .catch(() => {});

      return {
        message: 'Quotation updated successfully',
        version: newVersionNumber,
        finalAmount: totals.finalAmount,
        calculated: totals,
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to update quotation');
    }
  }

  async clone(id: string, user: RequestUser) {
    const t = await this.sequelize.transaction();
    try {
      const original = await this.quotationModel.findByPk(id, { transaction: t });
      if (!original) {
        await t.rollback();
        throw new NotFoundException('Quotation not found');
      }

      const originalItemsDoc = await this.quotationItemModel.findOne({ quotationId: id });
      let originalProducts: any = (originalItemsDoc as any)?.items || original.products || [];

      if (!Array.isArray(originalProducts) || originalProducts.length === 0) {
        await t.rollback();
        throw new BadRequestException('No products found in original quotation');
      }
      if (typeof originalProducts === 'string') {
        try {
          originalProducts = JSON.parse(originalProducts);
        } catch {
          await t.rollback();
          throw new BadRequestException('Invalid products data in original quotation');
        }
      }

      const productIds = [
        ...new Set(originalProducts.map((p: any) => p.productId || p.id).filter(Boolean)),
      ] as string[];
      const productMap = await this.enrichmentService.fetchProductMap(productIds, t);
      const enrichedProducts = this.enrichmentService.enrichProductsForClone(
        originalProducts,
        productMap,
      );

      const floors =
        Array.isArray(original.floors) && original.floors.length > 0
          ? original.floors
          : buildFloorsFromProducts(enrichedProducts);

      const totals = calculateTotals(
        enrichedProducts,
        Number(original.extraDiscount) || 0,
        (original.extraDiscountType as any) || 'percent',
        Number(original.shippingAmount) || 0,
        Number(original.gst) || 0,
      );

      const reference_number = await this.numberService.generateQuotationNumber(t);
      const newId = uuidv4();

      const cloned = await this.quotationModel.create(
        {
          quotationId: newId,
          document_title: `${original.document_title} (Duplicate)`,
          quotation_date: new Date().toISOString().split('T')[0],
          due_date: original.due_date,
          reference_number,
          customerId: original.customerId,
          createdBy: user?.userId,
          shipTo: original.shipTo,
          products: enrichedProducts,
          floors,
          totalFloors: floors.length,
          extraDiscount: Number(original.extraDiscount) || 0,
          extraDiscountType: original.extraDiscountType || 'percent',
          discountAmount: totals.extraDiscountAmount,
          shippingAmount: Number(original.shippingAmount) || 0,
          gst: Number(original.gst) || 0,
          gstAmount: totals.gstAmount,
          roundOff: totals.roundOff,
          finalAmount: totals.finalAmount,
          signature_name: original.signature_name || '',
          signature_image: original.signature_image || '',
          followupDates: original.followupDates || null,
        } as any,
        { transaction: t },
      );

      await this.quotationItemModel.create({ quotationId: newId, items: enrichedProducts } as any);

      await t.commit();

      this.activityLog
        .logActivity({
          userId: user?.userId,
          contextTag: CONTEXT_TAGS.SALES,
          subContext: SUB_CONTEXTS.QUOTATION,
          action: 'CLONE_QUOTATION',
          entityId: cloned.quotationId,
          entityName: reference_number,
          description: `Quotation cloned from ${original.reference_number}`,
          metadata: {
            originalQuotationId: id,
            originalReferenceNumber: original.reference_number,
            newQuotationId: cloned.quotationId,
            newReferenceNumber: reference_number,
            customerId: original.customerId,
            finalAmount: totals.finalAmount,
            productCount: enrichedProducts.length,
          },
        })
        .catch(() => {});

      return {
        message: 'Quotation cloned successfully',
        clonedQuotation: { ...cloned.toJSON(), finalAmount: totals.finalAmount },
        calculated: totals,
      };
    } catch (error: any) {
      if (t && !(t as any).finished) await t.rollback().catch(() => {});
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to clone quotation');
    }
  }

  async restoreVersion(id: string, version: number) {
    const t = await this.sequelize.transaction();
    try {
      const versionData = await this.quotationVersionModel.findOne({
        quotationId: id,
        version: Number(version),
      });
      if (!versionData) {
        await t.rollback();
        throw new NotFoundException('Version not found');
      }

      await this.quotationModel.update(
        {
          ...(versionData as any).quotationData,
          floors: (versionData as any).floors || [],
          totalFloors: (versionData as any).totalFloors || 0,
        },
        { where: { quotationId: id }, transaction: t },
      );

      if ((versionData as any).quotationItems?.length > 0) {
        await this.quotationItemModel.updateOne(
          { quotationId: id },
          { $set: { items: (versionData as any).quotationItems } },
          { upsert: true },
        );
      } else {
        await this.quotationItemModel.deleteOne({ quotationId: id });
      }

      await t.commit();

      // NOTE: legacy also called sendNotification() here - wire up once
      // NotificationsModule is migrated.

      return { message: `Quotation restored to version ${version}` };
    } catch (error: any) {
      await t.rollback().catch(() => {});
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error.message || 'Failed to restore quotation');
    }
  }

  async findOne(id: string) {
    const quotation = await this.quotationModel.findByPk(id);
    if (!quotation) throw new NotFoundException('Quotation not found');

    const mongoDoc = await this.quotationItemModel.findOne({ quotationId: id });
    const items = (mongoDoc as any)?.items || [];

    const grouped: Record<string, any> = {};
    items.forEach((item: any) => {
      const gid = item.groupId || 'ungrouped';
      if (!grouped[gid]) grouped[gid] = { main: null, options: [] };
      if (!item.isOptionFor) grouped[gid].main = item;
      else grouped[gid].options.push(item);
    });

    const calculated = calculateTotals(
      items,
      quotation.extraDiscount,
      quotation.extraDiscountType as any,
      quotation.shippingAmount,
      quotation.gst,
    );

    return {
      ...quotation.toJSON(),
      items,
      groupedItems: Object.values(grouped),
      calculated,
    };
  }

  async findAll(query: any) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 500;
    const offset = (page - 1) * limit;

    const where: any = {};
    const search = query.search?.trim();
    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { document_title: { [Op.like]: searchTerm } },
        { reference_number: { [Op.like]: searchTerm } },
      ];
    }
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.quotation_date = {};
      if (query.startDate) where.quotation_date[Op.gte] = query.startDate;
      if (query.endDate) where.quotation_date[Op.lte] = query.endDate;
    }

    const { count: totalQuotations, rows: quotations } = await this.quotationModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [['quotation_date', 'DESC']],
      subQuery: false,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['customerId', 'name', 'companyName', 'mobileNumber'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['userId', 'name', 'username'],
          required: false,
        },
      ],
    });

    if (quotations.length === 0) {
      return { data: [], pagination: { total: totalQuotations, page, limit, totalPages: 0 } };
    }

    const quotationIds = quotations.map((q) => q.quotationId);
    const mongoItems = await this.quotationItemModel
      .find({ quotationId: { $in: quotationIds } })
      .lean();

    const itemsMap: Record<string, any[]> = {};
    mongoItems.forEach((doc: any) => {
      itemsMap[doc.quotationId] = doc.items || [];
    });

    const data = quotations.map((q) => {
      const plain: any = q.toJSON();
      return {
        ...plain,
        items: itemsMap[plain.quotationId] || [],
        customerName: plain.customer?.name || plain.customer?.companyName || 'Walk-in Customer',
        createdByName: plain.creator?.name || 'Unknown',
      };
    });

    return {
      data,
      pagination: {
        total: totalQuotations,
        page,
        limit,
        totalPages: Math.ceil(totalQuotations / limit),
      },
    };
  }

  async remove(id: string, user: RequestUser) {
    const quotation = await this.quotationModel.findByPk(id);
    if (!quotation) throw new NotFoundException('Quotation not found');

    const roles = user.roles || [];
    if (
      !roles.includes('ADMIN') &&
      !roles.includes('SUPER_ADMIN') &&
      user.userId !== quotation.createdBy
    ) {
      throw new ForbiddenException(
        'Unauthorized: Only admins, super admins, or the creator can delete this quotation',
      );
    }

    await this.quotationModel.destroy({ where: { quotationId: id } });
    await this.quotationItemModel.deleteOne({ quotationId: id });

    this.activityLog
      .logActivity({
        userId: user?.userId,
        contextTag: CONTEXT_TAGS.SALES,
        subContext: SUB_CONTEXTS.QUOTATION,
        action: 'DELETE_QUOTATION',
        entityId: quotation.quotationId,
        entityName: quotation.reference_number || quotation.quotationId,
        description: `Quotation ${quotation.reference_number || quotation.quotationId} deleted`,
        oldValues: {
          quotationId: quotation.quotationId,
          referenceNumber: quotation.reference_number,
          createdBy: quotation.createdBy,
          customerId: quotation.customerId,
        },
      })
      .catch(() => {});

    return { message: 'Quotation deleted successfully' };
  }

  async getVersions(id: string) {
    const versions = await this.quotationVersionModel
      .find({ quotationId: id })
      .sort({ version: -1 })
      .lean();

    if (!versions || versions.length === 0) {
      throw new NotFoundException('No versions found');
    }

    return versions.map((v: any) => ({
      version: v.version,
      updatedBy: v.updatedBy || 'Unknown',
      updatedAt: v.updatedAt,
      finalAmount: v.quotationData?.finalAmount || 0,
      document_title: v.quotationData?.document_title || 'Untitled Quotation',
      customerId: v.quotationData?.customerId,
      quotation_date: v.quotationData?.quotation_date,
      itemCount: (v.quotationItems || []).length,
      quotationData: v.quotationData,
      quotationItems: v.quotationItems || [],
    }));
  }
}
