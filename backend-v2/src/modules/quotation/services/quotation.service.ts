import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongooseModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Quotation } from '../models/quotation.model'; // adjust to your actual model path
import { Customer } from '@/modules/customer/models/customer.model'; // adjust
import { User } from '@/modules/users/models/user.model'; // adjust
import { QuotationItem } from '../models/quotation-item.model'; // adjust
import { ActivityLogService } from '@/modules/engagement/services/activity-log.service'; // adjust to your actual service
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';
import { QueryQuotationDto } from '../dto/query-quotation.dto';
import { QuotationCalculationService } from './quotation-calculation.service';
import { QuotationNumberService } from './quotation-number.service';
import { QuotationProductEnrichmentService } from './quotation-product-enrichment.service';
import { QuotationVersionService } from './quotation-version.service';

interface RequestUser {
  userId: string;
  roles: string[];
}

@Injectable()
export class QuotationCrudService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,
    @InjectMongooseModel(QuotationItem.name)
    private readonly quotationItemModel: Model<QuotationItem>,
    private readonly calculationService: QuotationCalculationService,
    private readonly numberService: QuotationNumberService,
    private readonly enrichmentService: QuotationProductEnrichmentService,
    private readonly versionService: QuotationVersionService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async create(dto: CreateQuotationDto, user?: RequestUser) {
    const t = await this.sequelize.transaction();

    try {
      const due_date =
        !dto.due_date || dto.due_date === 'null' ? null : dto.due_date;

      const productIds = [
        ...new Set(
          dto.products.map((p) => p.productId || p.id).filter(Boolean),
        ),
      ] as string[];

      const productMap = await this.enrichmentService.fetchProductMasterMap(
        productIds,
        t,
      );

      const enrichedProducts = this.enrichmentService.enrichProducts(
        dto.products,
        productMap,
      );

      const floors =
        Array.isArray(dto.floors) && dto.floors.length > 0
          ? dto.floors
          : this.calculationService.buildFloorsFromProducts(enrichedProducts);

      const totals = this.calculationService.calculateTotals(
        enrichedProducts,
        Number(dto.extraDiscount),
        dto.extraDiscountType,
        Number(dto.shippingAmount),
        Number(dto.gst),
      );

      const reference_number = await this.numberService.generate(t);

      const {
        products: _p,
        floors: _f,
        extraDiscount,
        extraDiscountType,
        shippingAmount,
        gst,
        customerId,
        quotation_date,
        document_title,
        shipTo,
        signature_name,
        signature_image,
        due_date: _dd,
        ...rest
      } = dto as any;

      const quotation = await this.quotationModel.create(
        {
          customerId,
          reference_number,
          document_title,
          quotation_date:
            quotation_date || new Date().toISOString().split('T')[0],
          due_date,
          products: enrichedProducts,
          floors,
          totalFloors: floors.length,
          extraDiscount: Number(extraDiscount) || 0,
          extraDiscountType: extraDiscountType || 'percent',
          discountAmount: totals.extraDiscountAmount,
          shippingAmount: Number(shippingAmount) || 0,
          gst: Number(gst) || 0,
          gstAmount: totals.gstAmount,
          roundOff: totals.roundOff,
          finalAmount: totals.finalAmount,
          shipTo: shipTo || null,
          signature_name,
          signature_image,
          createdBy: user?.userId,
          ...rest,
        } as any,
        { transaction: t },
      );

      await this.quotationItemModel.create({
        quotationId: (quotation as any).quotationId,
        items: enrichedProducts,
      });

      await t.commit();

      await this.activityLog.log({
        userId: user?.userId,
        contextTag: 'SALES',
        subContext: 'QUOTATION',
        action: 'CREATE_QUOTATION',
        entityId: (quotation as any).quotationId,
        entityName: (quotation as any).reference_number,
        description: `Quotation ${(quotation as any).reference_number} created for customer ${customerId}`,
        metadata: {
          referenceNumber: (quotation as any).reference_number,
          customerId,
          productCount: enrichedProducts.length,
          floorCount: floors.length,
          financials: {
            totalAmount: totals.finalAmount,
            gst: Number(gst) || 0,
            gstAmount: totals.gstAmount,
            discount: Number(extraDiscount) || 0,
            discountType: extraDiscountType,
            shipping: Number(shippingAmount) || 0,
          },
          structure: {
            hasLocations: enrichedProducts.some((p) => p.locations?.length),
            hasOptions: enrichedProducts.some((p) => p.isOptionFor),
          },
          createdBy: user?.userId || null,
        },
      });

      return {
        message: 'Quotation created successfully',
        quotation: {
          ...(quotation as any).toJSON(),
          finalAmount: totals.finalAmount,
        },
        calculated: totals,
      };
    } catch (error) {
      await t.rollback().catch(() => undefined);
      throw error;
    }
  }

  async update(id: string, dto: UpdateQuotationDto, user?: RequestUser) {
    const t = await this.sequelize.transaction();

    try {
      const currentQuotation = await this.quotationModel.findOne({
        where: { quotationId: id },
        transaction: t,
      });

      if (!currentQuotation) {
        throw new NotFoundException('Quotation not found');
      }

      // Versioning is best-effort and must never block the update itself.
      let newVersionNumber = 1;
      try {
        newVersionNumber = await this.versionService.snapshotBeforeUpdate(
          id,
          user?.userId,
          t,
        );
      } catch (err) {
        // non-fatal — log and continue
        // eslint-disable-next-line no-console
        console.error('Versioning failed:', err);
      }

      const productIds = [
        ...new Set(
          dto.products.map((p) => p.productId || p.id).filter(Boolean),
        ),
      ] as string[];

      const productMap = await this.enrichmentService.fetchProductMasterMap(
        productIds,
        t,
      );

      const enrichedProducts = this.enrichmentService.enrichProducts(
        dto.products,
        productMap,
      );

      const floors =
        Array.isArray(dto.floors) && dto.floors.length > 0
          ? dto.floors
          : this.calculationService.buildFloorsFromProducts(enrichedProducts);

      const totals = this.calculationService.calculateTotals(
        enrichedProducts,
        Number(dto.extraDiscount),
        dto.extraDiscountType,
        Number(dto.shippingAmount),
        Number(dto.gst),
      );

      const {
        products: _p,
        floors: _f,
        followupDates = [],
        extraDiscount,
        extraDiscountType,
        shippingAmount,
        gst,
        ...quotationData
      } = dto as any;

      await this.quotationModel.update(
        {
          ...quotationData,
          products: enrichedProducts,
          floors,
          totalFloors: floors.length,
          extraDiscount: Number(extraDiscount) || 0,
          extraDiscountType: extraDiscountType || 'percent',
          discountAmount: totals.extraDiscountAmount,
          shippingAmount: Number(shippingAmount) || 0,
          gst: Number(gst) || 0,
          gstAmount: totals.gstAmount,
          roundOff: totals.roundOff,
          finalAmount: totals.finalAmount,
          followupDates: followupDates.length > 0 ? followupDates : null,
        },
        { where: { quotationId: id }, transaction: t },
      );

      // Mongo sync is best-effort; failures here don't roll back the PG write.
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
        // eslint-disable-next-line no-console
        console.error('MongoDB sync failed:', mongoErr);
      }

      await t.commit();

      await this.activityLog.log({
        userId: user?.userId,
        contextTag: 'SALES',
        subContext: 'QUOTATION',
        action: 'UPDATE_QUOTATION',
        entityId: (currentQuotation as any).quotationId,
        entityName: (currentQuotation as any).reference_number || id,
        description: `Quotation ${id} updated (version ${newVersionNumber})`,
        oldValues: {
          finalAmount: (currentQuotation as any).finalAmount,
          extraDiscount: (currentQuotation as any).extraDiscount,
          gst: (currentQuotation as any).gst,
          shippingAmount: (currentQuotation as any).shippingAmount,
        },
        newValues: {
          finalAmount: totals.finalAmount,
          extraDiscount,
          gst,
          shippingAmount,
        },
        metadata: {
          quotationId: id,
          version: newVersionNumber,
          productCount: enrichedProducts.length,
          floorCount: floors.length,
          versionCreated: true,
          financialImpact: {
            gstAmount: totals.gstAmount,
            discountAmount: totals.extraDiscountAmount,
            roundOff: totals.roundOff,
            finalAmount: totals.finalAmount,
          },
          mongoSynced: true,
          productStructureChanged: true,
          locationBasedQuotation: enrichedProducts.some((p) => p.locations),
        },
      });

      return {
        message: 'Quotation updated successfully',
        version: newVersionNumber,
        finalAmount: totals.finalAmount,
        calculated: totals,
      };
    } catch (error) {
      await t.rollback().catch(() => undefined);
      throw error;
    }
  }

  async clone(id: string, user?: RequestUser) {
    const t = await this.sequelize.transaction();

    try {
      const original = await this.quotationModel.findByPk(id, {
        transaction: t,
      });
      if (!original) {
        throw new NotFoundException('Quotation not found');
      }

      const originalItemsDoc = await this.quotationItemModel.findOne({
        quotationId: id,
      });
      let originalProducts: any[] =
        (originalItemsDoc as any)?.items || (original as any).products || [];

      if (typeof originalProducts === 'string') {
        try {
          originalProducts = JSON.parse(originalProducts);
        } catch {
          throw new BadRequestException(
            'Invalid products data in original quotation',
          );
        }
      }

      if (!Array.isArray(originalProducts) || originalProducts.length === 0) {
        throw new BadRequestException(
          'No products found in original quotation',
        );
      }

      const productIds = [
        ...new Set(
          originalProducts.map((p) => p.productId || p.id).filter(Boolean),
        ),
      ] as string[];

      const productMap = await this.enrichmentService.fetchProductMasterMap(
        productIds,
        t,
      );

      const enrichedProducts = this.enrichmentService.enrichProducts(
        originalProducts,
        productMap,
      );

      const floors =
        Array.isArray((original as any).floors) &&
        (original as any).floors.length > 0
          ? (original as any).floors
          : this.calculationService.buildFloorsFromProducts(enrichedProducts);

      const totals = this.calculationService.calculateTotals(
        enrichedProducts,
        Number((original as any).extraDiscount || 0),
        (original as any).extraDiscountType || 'percent',
        Number((original as any).shippingAmount || 0),
        Number((original as any).gst || 0),
      );

      const reference_number = await this.numberService.generate(t);
      const newId = uuidv4();

      const cloned = await this.quotationModel.create(
        {
          quotationId: newId,
          document_title: `${(original as any).document_title} (Duplicate)`,
          quotation_date: new Date().toISOString().split('T')[0],
          due_date: (original as any).due_date,
          reference_number,
          customerId: (original as any).customerId,
          createdBy: user?.userId,
          shipTo: (original as any).shipTo,
          products: enrichedProducts,
          floors,
          totalFloors: floors.length,
          extraDiscount: Number((original as any).extraDiscount) || 0,
          extraDiscountType: (original as any).extraDiscountType || 'percent',
          discountAmount: totals.extraDiscountAmount,
          shippingAmount: Number((original as any).shippingAmount) || 0,
          gst: Number((original as any).gst) || 0,
          gstAmount: totals.gstAmount,
          roundOff: totals.roundOff,
          finalAmount: totals.finalAmount,
          signature_name: (original as any).signature_name || '',
          signature_image: (original as any).signature_image || '',
          followupDates: (original as any).followupDates || null,
        } as any,
        { transaction: t },
      );

      await this.quotationItemModel.create({
        quotationId: newId,
        items: enrichedProducts,
      });

      await t.commit();

      await this.activityLog.log({
        userId: user?.userId,
        contextTag: 'SALES',
        subContext: 'QUOTATION',
        action: 'CLONE_QUOTATION',
        entityId: (cloned as any).quotationId,
        entityName: reference_number,
        description: `Quotation cloned from ${(original as any).reference_number}`,
        metadata: {
          originalQuotationId: id,
          originalReferenceNumber: (original as any).reference_number,
          newQuotationId: (cloned as any).quotationId,
          newReferenceNumber: reference_number,
          customerId: (original as any).customerId,
          finalAmount: totals.finalAmount,
          gstAmount: totals.gstAmount,
          discountAmount: totals.extraDiscountAmount,
          productCount: enrichedProducts.length,
          floorCount: floors.length,
          cloneType: 'FULL_DUPLICATE',
          includesPricingRecalculation: true,
        },
      });

      return {
        message: 'Quotation cloned successfully',
        clonedQuotation: {
          ...(cloned as any).toJSON(),
          finalAmount: totals.finalAmount,
        },
        calculated: totals,
      };
    } catch (error) {
      await t.rollback().catch(() => undefined);
      throw error;
    }
  }

  async findById(id: string) {
    const quotation = await this.quotationModel.findByPk(id);
    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    const mongoDoc = await this.quotationItemModel.findOne({ quotationId: id });
    const items = (mongoDoc as any)?.items || [];

    const grouped: Record<string, { main: any; options: any[] }> = {};
    items.forEach((item: any) => {
      const gid = item.groupId || 'ungrouped';
      if (!grouped[gid]) grouped[gid] = { main: null, options: [] };
      if (!item.isOptionFor) {
        grouped[gid].main = item;
      } else {
        grouped[gid].options.push(item);
      }
    });

    const groupedItems = Object.values(grouped);

    const calculated = this.calculationService.calculateTotals(
      items,
      (quotation as any).extraDiscount,
      (quotation as any).extraDiscountType,
      (quotation as any).shippingAmount,
      (quotation as any).gst,
    );

    return {
      ...(quotation as any).toJSON(),
      items,
      groupedItems,
      calculated,
    };
  }

  async findAll(query: QueryQuotationDto) {
    const page = query.page || 1;
    const limit = query.limit || 500;
    const offset = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (query.search?.trim()) {
      const searchTerm = `%${query.search.trim()}%`;
      where[Op.or as any] = [
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

    const { count: totalQuotations, rows: quotations } =
      await this.quotationModel.findAndCountAll({
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
      return {
        data: [],
        pagination: { total: totalQuotations, page, limit, totalPages: 0 },
      };
    }

    const quotationIds = quotations.map((q: any) => q.quotationId);

    const mongoItems = await this.quotationItemModel
      .find({ quotationId: { $in: quotationIds } })
      .lean();

    const itemsMap: Record<string, any[]> = {};
    mongoItems.forEach((itemDoc: any) => {
      itemsMap[itemDoc.quotationId] = itemDoc.items || [];
    });

    const enrichedQuotations = quotations.map((q: any) => {
      const plain = q.toJSON();
      return {
        ...plain,
        items: itemsMap[plain.quotationId] || [],
        customerName:
          plain.customer?.name ||
          plain.customer?.companyName ||
          'Walk-in Customer',
        createdByName: plain.creator?.name || 'Unknown',
        customer: plain.customer,
        creator: plain.creator,
      };
    });

    return {
      data: enrichedQuotations,
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
    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    if (
      !user.roles.includes('ADMIN') &&
      user.userId !== (quotation as any).createdBy
    ) {
      throw new ForbiddenException(
        'Unauthorized: Only admins or the creator can delete this quotation',
      );
    }

    await this.quotationModel.destroy({ where: { quotationId: id } });
    await this.quotationItemModel.deleteOne({ quotationId: id });

    await this.activityLog.log({
      userId: user.userId,
      contextTag: 'SALES',
      subContext: 'QUOTATION',
      action: 'DELETE_QUOTATION',
      entityId: (quotation as any).quotationId,
      entityName:
        (quotation as any).reference_number || (quotation as any).quotationId,
      description: `Quotation ${(quotation as any).reference_number || (quotation as any).quotationId} deleted`,
      oldValues: {
        quotationId: (quotation as any).quotationId,
        referenceNumber: (quotation as any).reference_number,
        createdBy: (quotation as any).createdBy,
        customerId: (quotation as any).customerId,
      },
      metadata: {
        deletionType: 'HARD_DELETE',
        isAdminAction: user.roles.includes('ADMIN'),
        isOwnerAction: user.userId === (quotation as any).createdBy,
        warning: 'Quotation permanently deleted',
        hasMongoCleanup: true,
      },
    });

    return { message: 'Quotation deleted successfully' };
  }
}
